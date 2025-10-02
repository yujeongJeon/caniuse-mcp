export async function fetchCanIUseData(feature: string): Promise<{
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
