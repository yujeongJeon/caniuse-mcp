import {DATA_SOURCES} from './consts.js'

export async function fetchCanIUseQueries(feature: string): Promise<{
    featureIds: string[]
}> {
    try {
        // actual API endpoint used by caniuse.com
        const response = await fetch(`https://caniuse.com/process/query.php?search=${feature}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch CanIUse queries: ${response.statusText}`)
        }

        const text = await response.text()
        const data = JSON.parse(text)

        if (!data.featureIds || !Array.isArray(data.featureIds)) {
            throw new Error('Invalid CanIUse response: missing featureIds array')
        }

        return data
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to fetch or parse CanIUse queries: ${errorMessage}`)
    }
}

export async function fetchCanIUse() {
    try {
        const response = await fetch(DATA_SOURCES.caniuse)

        if (!response.ok) {
            throw new Error(`Failed to fetch CanIUse data: ${response.statusText}`)
        }

        const text = await response.text()
        const caniuseData = JSON.parse(text)
        return caniuseData
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to fetch or parse CanIUse data: ${errorMessage}`)
    }
}
