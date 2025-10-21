import {DATA_SOURCES} from './consts.js'

export async function fetchCanIUseQueries(feature: string): Promise<{
    featureIds: string[]
}> {
    // actual API endpoint used by caniuse.com
    const response = await fetch(
        `
https://caniuse.com/process/query.php?search=${feature}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    )
    return await response.json()
}

export async function fetchCanIUse() {
    const caniuseData = await fetch(DATA_SOURCES.caniuse).then((r) => r.json())
    return caniuseData
}
