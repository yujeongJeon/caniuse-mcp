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
    mdnIdToBcdPath,
    parseMDNSupport,
    type SimplifiedMDNSupport,
} from './mdn.js'
import {fetchWebFeatures} from './web-features.js'

/**
 * Map MDN browser names to CanIUse browser names
 * MDN uses: safari_ios, chrome_android
 * CanIUse uses: ios_saf, and_chr
 */
const MDN_TO_CANIUSE_BROWSER_MAP: Record<string, string> = {
    chrome: 'chrome',
    edge: 'edge',
    safari: 'safari',
    firefox: 'firefox',
    safari_ios: 'ios_saf',
    chrome_android: 'and_chr',
}

const WEBFEATURES_TO_CANIUSE_BROWSER_MAP: Record<string, string> = {
    chrome: 'chrome',
    edge: 'edge',
    safari: 'safari',
    firefox: 'firefox',
    safari_ios: 'ios_saf',
    chrome_android: 'and_chr',
    // firefox_android는 CANIUSE_MAIN_BROWSERS에 없으므로 제외
}

export interface WebFeatureVersionSupport {
    sinceVersion: string // "76", "13", etc.
    status: 'supported'
}

export interface CompatibilityResult {
    source: 'caniuse' | 'mdn' | 'web-features'
    id: string
    path?: string
    title?: string
    description?: string
    support: Record<string, GroupedVersionSupport[] | SimplifiedMDNSupport[] | WebFeatureVersionSupport[]>
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
                const support: Record<string, WebFeatureVersionSupport[]> = {}

                // Web Features의 support 데이터를 CanIUse 브라우저 이름으로 변환
                for (const [wfBrowser, version] of Object.entries(webFeature.status.support)) {
                    const caniuseBrowser = WEBFEATURES_TO_CANIUSE_BROWSER_MAP[wfBrowser]
                    if (caniuseBrowser && version && CANIUSE_MAIN_BROWSERS.includes(caniuseBrowser)) {
                        support[caniuseBrowser] = [
                            {
                                sinceVersion: version,
                                status: 'supported',
                            },
                        ]
                    }
                }

                // Web Feature의 compat_features를 MDN ID로 변환
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

                // 연관된 MDN 데이터도 함께 가져오기
                for (const mdnId of mdnIds) {
                    const bcdPath = mdnIdToBcdPath(mdnId)
                    const compatData = getNestedProperty(mdnData, bcdPath)

                    if (compatData?.__compat) {
                        const mdnCompatData = compatData.__compat
                        const mdnSupport: Record<string, SimplifiedMDNSupport[]> = {}

                        for (const browser of MDN_MAIN_BROWSERS) {
                            const browserData = mdnCompatData.support[browser]
                            if (browserData) {
                                mdnSupport[browser] = parseMDNSupport(browserData)
                            }
                        }

                        results.push({
                            source: 'mdn',
                            id: mdnId,
                            title: mdnCompatData.description || bcdPath,
                            description: mdnCompatData.mdn_url,
                            path: mdnCompatData.spec_url,
                            status: mdnCompatData.status,
                            support: mdnSupport,
                        })
                    }
                }
            }
        } else if (featureId.startsWith('mdn-')) {
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
 * Check if a target version is within a version range string
 * Handles formats like: "122", "15-17", "122+", "15-17.1"
 */
export function isVersionInRange(targetVersion: string, versionRange: string): boolean {
    // "122+" 형태: targetVersion >= 122
    if (versionRange.endsWith('+')) {
        const minVersion = versionRange.slice(0, -1)
        return compareVersion(targetVersion, minVersion) >= 0
    }

    // "15-17" 형태: 15 <= targetVersion <= 17
    if (versionRange.includes('-')) {
        const [minVersion, maxVersion] = versionRange.split('-')
        return compareVersion(targetVersion, minVersion) >= 0 && compareVersion(targetVersion, maxVersion) <= 0
    }

    // "122" 형태: 정확히 일치
    return compareVersion(targetVersion, versionRange) === 0
}

/**
 * Filter GroupedVersionSupport[] to only include entries that match target versions
 */
export function filterGroupedVersionSupport(
    groupedSupport: GroupedVersionSupport[],
    targetVersions: string[],
): GroupedVersionSupport[] {
    return groupedSupport.filter((group) => {
        // 타겟 버전 중 하나라도 이 그룹의 범위에 포함되면 유지
        return targetVersions.some((targetVersion) => isVersionInRange(targetVersion, group.versions))
    })
}

/**
 * Filter SimplifiedMDNSupport[] to only include entries relevant to target versions
 */
export function filterMDNSupport(mdnSupport: SimplifiedMDNSupport[], targetVersions: string[]): SimplifiedMDNSupport[] {
    return mdnSupport.filter((support) => {
        // sinceVersion이 없으면 (unknown 등) 일단 포함
        if (!support.sinceVersion) return true

        // 타겟 버전 중 하나라도 sinceVersion 이상이면 포함
        return targetVersions.some((targetVersion) => {
            const isAfterSince = compareVersion(targetVersion, support.sinceVersion!) >= 0

            // untilVersion이 있으면 그보다 이전인지도 확인
            if (support.untilVersion) {
                return isAfterSince && compareVersion(targetVersion, support.untilVersion) < 0
            }

            return isAfterSince
        })
    })
}

/**
 * Filter WebFeatureVersionSupport[] to only include if target versions meet the requirement
 */
export function filterWebFeatureSupport(
    webFeatureSupport: WebFeatureVersionSupport[],
    targetVersions: string[],
): WebFeatureVersionSupport[] {
    return webFeatureSupport.filter((support) => {
        // 타겟 버전 중 하나라도 sinceVersion 이상이면 포함
        return targetVersions.some((targetVersion) => {
            return compareVersion(targetVersion, support.sinceVersion) >= 0
        })
    })
}

/**
 * Filter compatibility results by target browser versions
 */
export function filterCompatibilityByVersions(
    results: CompatibilityResult[],
    targetBrowserVersions: Record<string, string[]>,
): CompatibilityResult[] {
    return results.map((result) => {
        const filteredSupport: Record<
            string,
            GroupedVersionSupport[] | SimplifiedMDNSupport[] | WebFeatureVersionSupport[]
        > = {}

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

            if (result.source === 'caniuse') {
                filteredSupport[browser] = filterGroupedVersionSupport(
                    versionSupport as GroupedVersionSupport[],
                    targetVersions,
                )
            } else if (result.source === 'mdn') {
                filteredSupport[browser] = filterMDNSupport(versionSupport as SimplifiedMDNSupport[], targetVersions)
            } else if (result.source === 'web-features') {
                filteredSupport[browser] = filterWebFeatureSupport(
                    versionSupport as WebFeatureVersionSupport[],
                    targetVersions,
                )
            }
        }

        return {
            ...result,
            support: filteredSupport,
        }
    })
}
