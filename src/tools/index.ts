import {caniuseTool} from './caniuse/index.js'
import {createListToolsTool} from './list-tools/index.js'
import {ToolRegistry} from './registry.js'

export function createToolRegistry(): ToolRegistry {
    const registry = new ToolRegistry()

    // Register all tools here
    registry.register(caniuseTool)

    // Add list-tools at the end so it can list all other tools
    registry.register(createListToolsTool(registry))

    return registry
}
