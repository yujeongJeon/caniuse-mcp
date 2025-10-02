#!/usr/bin/env node
import {FastMCP} from 'fastmcp'

import {createToolRegistry} from './tools/index.js'

const server = new FastMCP({
    name: 'caniuse-mcp',
    version: '1.0.0',
    logger: console,
    instructions: 'Type your questions about web platform compatibility based on caniuse.com!',
})

const registry = createToolRegistry()
registry.registerAll(server)

server.start({
    transportType: 'stdio',
})
