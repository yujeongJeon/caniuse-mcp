import z from 'zod'

/**
 * One of the following:
 * - A string representing a Browserslist query, e.g., "> 1%, last 2 versions, not dead"
 * - A configuration file path to a Browserslist config file (.browserslistrc or package.json) and project path
 */
export const browserslistCompatInputSchema = z.object({
    feature: z
        .string()
        .describe('The web feature to check compatibility for, e.g., "flexbox", "grid", "es6", "array.findindex"'),
    browserslistQuery: z
        .string()
        .optional()
        .describe('Browserslist query string, e.g., "> 1%, last 2 versions, not dead"'),
    configPath: z.string().optional().describe('Path to browserslist config file (.browserslistrc or package.json)'),
    projectPath: z.string().optional().describe('Project root path to automatically find browserslist config'),
})

export type BrowserslistCompatInputSchema = z.infer<typeof browserslistCompatInputSchema>
