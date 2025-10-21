import {caniuseInputSchema, type CaniUseInputSchema} from './schema.js'
import {fetchCanIUse, fetchCanIUseQueries} from '../../lib/caniuse-api.js'
import {
    groupBrowserVersions,
    CANIUSE_MAIN_BROWSERS,
    type FeatureData,
    type GroupedVersionSupport,
} from '../../lib/caniuse-db.js'
import {
    fetchMDNData,
    getNestedProperty,
    MDN_MAIN_BROWSERS,
    mdnIdToBcdPath,
    parseMDNSupport,
    type SimplifiedMDNSupport,
} from '../../lib/mdn.js'

import type {FastMCPContext} from '../registry.js'
import type {AudioContent, ImageContent, TextContent} from 'fastmcp'

interface CompatibilityResult {
    source: 'caniuse' | 'mdn'
    id: string
    path?: string
    title?: string
    description?: string
    support: any
    status?: any
}

async function searchAndFetchCompatData(featureIds: string[]): Promise<CompatibilityResult[]> {
    const results: CompatibilityResult[] = []

    // caniuse-db 데이터 로드
    const caniuseData = await fetchCanIUse()

    // MDN 데이터 로드
    const mdnData = await fetchMDNData()

    for (const featureId of featureIds) {
        if (featureId.startsWith('mdn-')) {
            // MDN 데이터에서 찾기
            const bcdPath = mdnIdToBcdPath(featureId)
            const compatData = getNestedProperty(mdnData, bcdPath)

            if (compatData?.__compat) {
                const mdnCompatData = compatData.__compat
                const support: Record<string, SimplifiedMDNSupport[]> = {}

                for (const browser of MDN_MAIN_BROWSERS) {
                    const browserData = mdnCompatData.support[browser]
                    if (browserData) {
                        support[browser] = parseMDNSupport(browserData)
                    }
                }

                results.push({
                    source: 'mdn',
                    id: featureId,
                    title: mdnCompatData.description || bcdPath,
                    description: mdnCompatData.mdn_url,
                    path: mdnCompatData.spec_url,
                    status: mdnCompatData.status,
                    support,
                })
            }
        } else {
            const compatData: FeatureData = caniuseData.data[featureId]

            if (!compatData) {
                // eslint-disable-next-line no-console
                console.error(`Feature ID "${featureId}" not found in caniuse data.`)
                continue
            }

            const agents = caniuseData.agents
            const notesByNum = compatData.notes_by_num

            const result: Record<string, GroupedVersionSupport[]> = {}

            for (const browser of CANIUSE_MAIN_BROWSERS) {
                if (compatData.stats[browser] && agents[browser]) {
                    result[browser] = groupBrowserVersions(compatData.stats[browser], agents[browser], notesByNum)
                }
            }

            results.push({
                source: 'caniuse',
                id: featureId,
                title: compatData.title,
                description: compatData.description,
                support: result,
            })
        }
    }

    return results
}

const executeCaniuse = async ({feature}: CaniUseInputSchema, {session}: FastMCPContext) => {
    // 1. caniuse.com 검색 API로 feature ID들 가져오기
    const queries = await fetchCanIUseQueries(feature)

    if (session?.clientCapabilities?.sampling && typeof session?.requestSampling === 'function') {
        const response: {
            content: AudioContent | ImageContent | TextContent
            model: string
            role: 'assistant' | 'user'
            stopReason?: 'endTurn' | 'maxTokens' | 'stopSequence' | string
        } = await session.requestSampling({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please select the caniuse search keywords that are closest to the intent of "${feature}" from the following options:\n\n${queries.featureIds.join(
                            ', ',
                        )}\n\nResponse format: List the selected keywords separated by commas`,
                    },
                },
            ],
            systemPrompt: `You are a web compatibility expert specializing in caniuse.com data. 
            
        RESPONSE FORMAT: Return only the selected feature IDs separated by commas, no explanations.
        Example: "flexbox, grid-layout, css-variables"`,
            maxTokens: 120,
            temperature: 0.1,
            stopSequences: ['\n', '.'],
        })

        if (response.content.type === 'text') {
            const text = response.content.text as string
            const targetIds = text
                .replace(/"/g, '')
                .split(',')
                .map((id) => id.trim())
                .filter((id) => queries.featureIds.includes(id))

            if (targetIds.length > 0) {
                queries.featureIds = targetIds
            }
        }
    }

    const result = await searchAndFetchCompatData(queries.featureIds)

    return {
        content: [
            {
                type: 'text',
                text: `# caniuse Feature Lookup Result for "${feature}"\n\n` + JSON.stringify(result, null, 2),
            },
        ],
    }
}

export const caniuseTool = {
    name: 'caniuse_feature',
    description: `Look up the compatibility of web features across different browsers using data from caniuse.com.`,
    parameters: caniuseInputSchema,
    execute: executeCaniuse,
}
