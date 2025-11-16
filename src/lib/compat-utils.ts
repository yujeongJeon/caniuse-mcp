import {fetchCanIUse} from './caniuse-api.js'
import {
    CANIUSE_MAIN_BROWSERS,
    groupBrowserVersions,
    type FeatureData,
    type GroupedVersionSupport,
} from './caniuse-db.js'
import {
    fetchMDNData,
    getNestedProperty,
    MDN_MAIN_BROWSERS,
    MDN_TO_CANIUSE_BROWSER_MAP,
    mdnIdToBcdPath,
    parseMDNSupport,
    type SimplifiedMDNSupport,
} from './mdn.js'
import {fetchWebFeatures, WEBFEATURES_TO_CANIUSE_BROWSER_MAP} from './web-features.js'

export interface CompatibilityResult {
    source: 'caniuse' | 'mdn' | 'web-features'
    id: string
    path?: string
    title?: string
    description?: string
    support: Record<string, Record<string, string>> // browser -> { version: status }
    status?: any
    baseline?: {
        status: 'high' | 'low' | false
        lowDate?: string
        highDate?: string
    }
    relatedFeatures?: {
        mdn?: string[] // Related MDN BCD identifiers
    }
}

/**
 * Convert grouped version support to simple format
 */
function convertGroupedToSimple(grouped: GroupedVersionSupport[]): Record<string, string> {
    const result: Record<string, string> = {}

    for (const group of grouped) {
        let value = group.status
        const extras: string[] = []

        if (group.requiresPrefix) extras.push('requires prefix')
        if (group.requiresFlag) extras.push('requires flag')
        if (group.hasPolyfill) extras.push('polyfill available')
        if (group.notes && group.notes.length > 0) {
            extras.push(...group.notes)
        }

        if (extras.length > 0) {
            value += ` (${extras.join(', ')})`
        }

        // Extract first version from range
        const version = group.versions.split('-')[0].replace('+', '')
        result[version] = value
    }

    return result
}

/**
 * Convert MDN support to simple format
 */
function convertMDNToSimple(mdnSupports: SimplifiedMDNSupport[]): Record<string, string> {
    const result: Record<string, string> = {}

    for (const support of mdnSupports) {
        if (!support.sinceVersion) continue

        let value = support.status
        const extras: string[] = []

        if (support.requiresPrefix) extras.push('requires prefix')
        if (support.requiresFlag) extras.push('requires flag')
        if (support.notes && support.notes.length > 0) {
            extras.push(...support.notes)
        }

        if (extras.length > 0) {
            value += ` (${extras.join(', ')})`
        }

        result[support.sinceVersion] = value
    }

    return result
}

/**
 * Fetch compatibility data for multiple feature IDs from CanIUse, MDN, and Web Features
 */
export async function searchAndFetchCompatData(featureIds: string[]): Promise<CompatibilityResult[]> {
    const results: CompatibilityResult[] = []

    // caniuse-db 데이터 로드
    const caniuseData = await fetchCanIUse()

    // MDN 데이터 로드
    const mdnData = await fetchMDNData()

    // Web Features 데이터 로드
    const webFeaturesData = await fetchWebFeatures()

    for (const featureId of featureIds) {
        if (featureId.startsWith('wf-')) {
            // Web Features 데이터에서 찾기
            const wfId = featureId.substring(3)
            const webFeature = webFeaturesData[wfId]

            if (webFeature && webFeature.status?.support) {
                const support: Record<string, Record<string, string>> = {}

                // Web Features의 support 데이터를 CanIUse 브라우저 이름으로 변환
                for (const [wfBrowser, version] of Object.entries(webFeature.status.support)) {
                    const caniuseBrowser = WEBFEATURES_TO_CANIUSE_BROWSER_MAP[wfBrowser]
                    if (caniuseBrowser && version && CANIUSE_MAIN_BROWSERS.includes(caniuseBrowser)) {
                        support[caniuseBrowser] = {
                            [version]: 'supported',
                        }
                    }
                }

                // Only include related MDN IDs in Web Features, skip fetching actual data to avoid duplication
                // Users can query separately using IDs from relatedFeatures.mdn if detailed information is needed
                const mdnIds =
                    webFeature.compat_features?.map((bcdPath) => `mdn-${bcdPath.replace(/\./g, '_').toLowerCase()}`) ||
                    []

                results.push({
                    source: 'web-features',
                    id: featureId,
                    title: webFeature.name,
                    description: webFeature.description,
                    path: Array.isArray(webFeature.spec) ? webFeature.spec[0] : webFeature.spec,
                    support,
                    baseline: {
                        status: webFeature.status.baseline,
                        lowDate: webFeature.status.baseline_low_date,
                        highDate: webFeature.status.baseline_high_date,
                    },
                    relatedFeatures: mdnIds.length > 0 ? {mdn: mdnIds} : undefined,
                })
            }
        } else if (featureId.startsWith('mdn-')) {
            // MDN 데이터에서 찾기
            const bcdPath = mdnIdToBcdPath(featureId)
            const compatData = getNestedProperty(mdnData, bcdPath)

            if (compatData?.__compat) {
                const mdnCompatData = compatData.__compat
                const support: Record<string, Record<string, string>> = {}

                for (const browser of MDN_MAIN_BROWSERS) {
                    const browserData = mdnCompatData.support[browser]
                    if (browserData) {
                        const parsed = parseMDNSupport(browserData)
                        support[browser] = convertMDNToSimple(parsed)
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

            const support: Record<string, Record<string, string>> = {}

            for (const browser of CANIUSE_MAIN_BROWSERS) {
                if (compatData.stats[browser] && agents[browser]) {
                    const grouped = groupBrowserVersions(compatData.stats[browser], agents[browser], notesByNum)
                    support[browser] = convertGroupedToSimple(grouped)
                }
            }

            results.push({
                source: 'caniuse',
                id: featureId,
                title: compatData.title,
                description: compatData.description,
                support,
            })
        }
    }

    return results
}

/**
 * Compare two version strings using semantic versioning
 * @returns negative if a < b, 0 if a === b, positive if a > b
 */
export function compareVersion(a: string, b: string): number {
    // "all" 같은 특수 케이스 처리
    if (a === 'all' || b === 'all') return 0

    // "TP" (Technology Preview) 같은 특수 버전 처리
    if (a === 'TP') return 1
    if (b === 'TP') return -1

    const aParts = a.split(/[.-]/).map((x) => parseInt(x, 10) || 0)
    const bParts = b.split(/[.-]/).map((x) => parseInt(x, 10) || 0)

    const maxLength = Math.max(aParts.length, bParts.length)

    for (let i = 0; i < maxLength; i++) {
        const aPart = aParts[i] || 0
        const bPart = bParts[i] || 0

        if (aPart !== bPart) {
            return aPart - bPart
        }
    }

    return 0
}

/**
 * Filter compatibility results by target browser versions
 */
export function filterCompatibilityByVersions(
    results: CompatibilityResult[],
    targetBrowserVersions: Record<string, string[]>,
): CompatibilityResult[] {
    return results.map((result) => {
        const filteredSupport: Record<string, Record<string, string>> = {}

        for (const [browser, versionSupport] of Object.entries(result.support)) {
            // MDN의 경우 browser 이름을 CanIUse 형식으로 변환해서 매칭
            let targetVersions: string[] | undefined

            if (result.source === 'mdn') {
                // MDN browser name -> CanIUse browser name
                const caniuseBrowser = MDN_TO_CANIUSE_BROWSER_MAP[browser]
                targetVersions = caniuseBrowser ? targetBrowserVersions[caniuseBrowser] : undefined
            } else {
                // CanIUse와 Web Features는 직접 매칭
                targetVersions = targetBrowserVersions[browser]
            }

            if (!targetVersions || targetVersions.length === 0) continue

            // 간단한 필터링: 타겟 버전에 해당하는 항목만 유지
            const filtered: Record<string, string> = {}
            for (const [version, status] of Object.entries(versionSupport)) {
                // 타겟 버전 중 하나라도 이 버전 이상이면 포함
                if (targetVersions.some((tv) => compareVersion(tv, version) >= 0)) {
                    filtered[version] = status
                }
            }

            if (Object.keys(filtered).length > 0) {
                filteredSupport[browser] = filtered
            }
        }

        return {
            ...result,
            support: filteredSupport,
        }
    })
}
