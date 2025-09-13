#!/usr/bin/env node
import {FastMCP} from 'fastmcp'

const server = new FastMCP({
    name: 'mermaid-mcp',
    version: '1.0.0',
    logger: console,
})

server.start({
    transportType: 'stdio',
})
