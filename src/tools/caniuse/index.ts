import {caniuseInputSchema, type CaniUseInputSchema} from './schema.js'
import {fetchCanIUseQueries} from '../../lib/caniuse-api.js'
import {searchAndFetchCompatData} from '../../lib/compat-utils.js'

import type {FastMCPContext} from '../registry.js'
import type {AudioContent, ImageContent, TextContent} from 'fastmcp'

const executeCaniuse = async ({feature}: CaniUseInputSchema, ctx: FastMCPContext) => {
    // 1. caniuse.com 검색 API로 feature ID들 가져오기
    const queries = await fetchCanIUseQueries(feature)

    const session = ctx?.session
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
