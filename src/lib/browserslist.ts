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
