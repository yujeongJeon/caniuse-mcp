import {readFile} from 'fs/promises'
import {join, resolve} from 'path'

import {browserslistCompatInputSchema, type BrowserslistCompatInputSchema} from './schema.js'

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
        let query = browserslistQuery
        if (!query) {
            query = await loadBrowserslistConfig(configPath, projectPath)
        } else if (Array.isArray(query)) {
            query = query.join(', ')
        }

        // TODO Implement browserslist-compat

        return {
            content: [
                {
                    type: 'text',
                    text: `# Browserslist Compatibility Check Result for "${feature}"\n\n`,
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
