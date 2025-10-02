import z from 'zod'

export const caniuseInputSchema = z.object({
    feature: z.string().describe('The feature to look up on caniuse.com, e.g., "flexbox", "grid", "es6", "array.at"'),
})
export type CaniUseInputSchema = z.infer<typeof caniuseInputSchema>
