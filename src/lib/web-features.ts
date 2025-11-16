export const WEBFEATURES_TO_CANIUSE_BROWSER_MAP: Record<string, string> = {
    chrome: 'chrome',
    edge: 'edge',
    safari: 'safari',
    firefox: 'firefox',
    safari_ios: 'ios_saf',
    chrome_android: 'and_chr',
}

export interface WebFeatureVersionSupport {
    sinceVersion: string
    status: 'supported'
}

export interface WebFeatureSupport {
    chrome?: string
    chrome_android?: string
    edge?: string
    firefox?: string
    firefox_android?: string
    safari?: string
    safari_ios?: string
}

export interface WebFeature {
    name: string
    description?: string
    description_html?: string
    spec?: string | string[]
    status?: {
        baseline: 'high' | 'low' | false
        baseline_low_date?: string
        baseline_high_date?: string
        support?: WebFeatureSupport
        by_compat_key?: Record<
            string,
            {
                baseline: 'high' | 'low' | false
                baseline_low_date?: string
                baseline_high_date?: string
                support?: WebFeatureSupport
            }
        >
    }
    compat_features?: string[] // MDN BCD identifiers
    group?: string[]
    kind?: string
    snapshot?: string[]
}

export interface WebFeaturesData {
    [featureId: string]: WebFeature
}

export interface WebFeaturesResponse {
    browsers: Record<string, any>
    features: WebFeaturesData
    groups: Record<string, any>
    snapshots: Record<string, any>
}

/**
 * Fetch web-features data from unpkg CDN
 */
export async function fetchWebFeatures(): Promise<WebFeaturesData> {
    try {
        const response = await fetch('https://unpkg.com/web-features@latest/data.json')

        if (!response.ok) {
            throw new Error(`Failed to fetch web-features data: ${response.statusText}`)
        }

        const text = await response.text()
        const data: WebFeaturesResponse = JSON.parse(text)

        if (!data.features || typeof data.features !== 'object') {
            throw new Error('Invalid web-features data structure: missing features object')
        }

        return data.features
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to fetch or parse web-features data: ${errorMessage}`)
    }
}

/**
 * Get a specific web feature by ID (without 'wf-' prefix)
 * @param featureId Feature ID without 'wf-' prefix (e.g., 'promise-allsettled')
 */
export async function getWebFeature(featureId: string): Promise<WebFeature | null> {
    const features = await fetchWebFeatures()
    return features[featureId] || null
}
