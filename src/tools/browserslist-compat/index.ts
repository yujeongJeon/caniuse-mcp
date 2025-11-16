import {readFile} from 'fs/promises'
import {join, resolve} from 'path'

import {browserslistCompatInputSchema, type BrowserslistCompatInputSchema} from './schema.js'
import {parseBrowserslistQuery, extractTargetBrowserVersions} from '../../lib/browserslist.js'
import {fetchCanIUseQueries} from '../../lib/caniuse-api.js'
import {searchAndFetchCompatData, filterCompatibilityByVersions} from '../../lib/compat-utils.js'

async function loadBrowserslistConfig(configPath?: string, projectPath?: string): Promise<string> {
    if (configPath) {
        try {
            const configData = await readFile(resolve(configPath), 'utf8')

            return configData.trim()
        } catch {
            /** IGNORE. Use projectPath */
        }
    }

    if (projectPath) {
        try {
            const browserslistrcPath = join(projectPath, '.browserslistrc')
            const configData = await readFile(browserslistrcPath, 'utf8')

            return configData.trim()
        } catch {
            try {
                const packageJsonPath = join(projectPath, 'package.json')
                const packageJsonData = await readFile(packageJsonPath, 'utf8')
                const packageJson = JSON.parse(packageJsonData)

                if (packageJson.browserslist) {
                    return Array.isArray(packageJson.browserslist)
                        ? packageJson.browserslist.join(', ')
                        : packageJson.browserslist
                }
            } catch {
                /** IGNORE. Use defaults */
            }
        }
    }

    return 'defaults'
}

const executeBrowserslistCompat = async ({
    feature,
    browserslistQuery,
    configPath,
    projectPath,
}: BrowserslistCompatInputSchema) => {
    try {
        // 1. Load browserslist query
        let query = browserslistQuery
        if (!query) {
            query = await loadBrowserslistConfig(configPath, projectPath)
        } else if (Array.isArray(query)) {
            query = query.join(', ')
        }

        // 2. Parse browserslist to get target browser versions
        const browserslistData = await parseBrowserslistQuery(query)
        const targetVersions = extractTargetBrowserVersions(browserslistData)

        // 3. Search for feature IDs
        const queries = await fetchCanIUseQueries(feature)

        // Notify if multiple features found
        let multipleFeatureNote = ''
        if (queries.featureIds.length > 1) {
            multipleFeatureNote = `\n> **Note:** Multiple features found matching "${feature}": ${queries.featureIds.join(
                ', ',
            )}\n> Showing compatibility for all matching features.\n\n`
        }

        // 4. Fetch compatibility data for all features
        const compatResults = await searchAndFetchCompatData(queries.featureIds)

        // 5. Filter by target browser versions
        const filteredResults = filterCompatibilityByVersions(compatResults, targetVersions)

        // 6. Format target browsers for display (abbreviated)
        const targetBrowsersList = Object.entries(targetVersions)
            .map(([browser, versions]) => {
                if (versions.length === 1) {
                    return `${browser} ${versions[0]}`
                } else if (versions.length <= 3) {
                    return `${browser} ${versions.join(', ')}`
                }
                // More than 3 versions: show count and sample
                return `${browser} (${versions.length} versions: ${versions[0]}, ${versions[1]}, ...)`
            })
            .join(', ')

        return {
            content: [
                {
                    type: 'text',
                    text:
                        `# Browserslist Compatibility Check for "${feature}"\n\n` +
                        `**Query:** \`${query}\`\n` +
                        `**Target Browsers:** ${targetBrowsersList}\n` +
                        multipleFeatureNote +
                        '\n---\n\n' +
                        JSON.stringify(filteredResults, null, 2),
                },
            ],
        }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `# Browserslist Compatibility Check Error\n\nError: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`,
                },
            ],
        }
    }
}

export const browserslistCompatTool = {
    name: 'browserslist_compatibility_check',
    description: `Check web feature compatibility against your browserslist configuration. 
    This tool analyzes whether a web feature is supported by the browsers specified in your browserslist query, 
    .browserslistrc file, or package.json browserslist field.`,
    parameters: browserslistCompatInputSchema,
    execute: executeBrowserslistCompat,
}
