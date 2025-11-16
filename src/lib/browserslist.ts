export type BrowserslistApiResponse = {
    /** coverage by browsers(chrome, and_chr, ios_saf, edge, samsung, node) */
    browsers: Array<{
        id: string
        name: string
        versions: Record<string, number>
    }>
    /** current version of browserslist, caniuse-db */
    versions: {
        browserslist: string
        caniuse: string
    }
}

export async function parseBrowserslistQuery(browserslistQuery: string): Promise<BrowserslistApiResponse> {
    const response = await fetch(`https://browsersl.ist/api/browsers?q=${browserslistQuery}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/json',
        },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch browserslist data: ${response.statusText}`)
    }

    return (await response.json()) satisfies BrowserslistApiResponse
}

/**
 * Extract target browser versions from browserslist API response
 * @returns Record<browserId, versions[]> e.g., { chrome: ['122', '123'], safari: ['15.0'] }
 */
export function extractTargetBrowserVersions(browserslistData: BrowserslistApiResponse): Record<string, string[]> {
    const targetVersions: Record<string, string[]> = {}

    for (const browser of browserslistData.browsers) {
        const versions = Object.keys(browser.versions).sort((a, b) => {
            // Sort versions in ascending order
            const [aMajor] = a.split('.').map(Number)
            const [bMajor] = b.split('.').map(Number)
            return aMajor - bMajor
        })

        if (versions.length > 0) {
            targetVersions[browser.id] = versions
        }
    }

    return targetVersions
}
