# 📊 Caniuse MCP

[![npm version](https://img.shields.io/npm/v/caniuse-mcp.svg)](https://www.npmjs.com/package/caniuse-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server providing browser compatibility data and web API support information using the caniuse.com database.

## Features

- **Browser Compatibility Data**: Get detailed compatibility information for web features across all major browsers
- **Feature Search**: Look up web features by name using the comprehensive caniuse database
- **Always Up-to-Date**: Queries the latest compatibility data from the caniuse database in real-time
- **MCP Compatible**: Works seamlessly with any MCP-compatible client
- **Smart Feature Sampling**: Provides accurate compatibility data through intelligent sampling of feature variants and edge cases

> [!NOTE]
> However, some MCP clients may not support sampling features, which could affect the comprehensiveness of the compatibility information returned.

## Installation

```bash
npm install -g caniuse-mcp
```

Or with pnpm:

```bash
pnpm add -g caniuse-mcp
```

## Usage

### As an MCP Server

Add to your MCP client configuration.

Vscode with copilot:

```json
{
  "servers": {
    "caniuse": {
      "command": "npx",
      "args": ["-y", "caniuse-mcp"]
    }
  }
}
```

Claude desktop:

```json
{
  "mcpServers": {
    "caniuse": {
      "command": "npx",
      "args": ["-y", "caniuse-mcp"]
    }
  }
}
```

### Available Tools

#### 1. `caniuse_feature`

Look up browser compatibility for web features.

**Parameters:**

- `feature` (string): The feature to look up (e.g., "flexbox", "grid", "promises", "fetch")

**Example:**

```text
Please tell me the scope of the "promises" browser support.
```

**Response:**

Returns detailed compatibility information including:

- Support status for major browsers: Chrome, Firefox, Safari, Edge, iOS Safari, Chrome Android
- Version ranges where the feature is supported
- Partial support information
- Notes about implementation differences
- Polyfill availability

#### 2. `list_tools`

List all available tools and their descriptions.

**Example Response:**

```text
# Available Tools in caniuse-mcp

## caniuse-feature
Look up the compatibility of web features across different browsers using data from caniuse.com.

## list-tools  
List all available tools and their descriptions
```

## Supported Browsers

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome, Samsung Internet
- **Legacy**: Internet Explorer (with polyfill information)

## Feature Categories

The server supports compatibility data for:

- CSS Properties & Values
- HTML Elements & Attributes  
- JavaScript APIs
- Web APIs (Fetch, WebSockets, etc.)
- ECMAScript Features
- Media & Graphics APIs
- Security Features
- Performance APIs
- And many more...

## Development

### Prerequisites

- Node.js 20+
- pnpm@10.6.5

### Setup

```bash
# Clone the repository
git clone https://github.com/yujeongJeon/caniuse-mcp.git
cd caniuse-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Scripts

- `pnpm build` - Build the TypeScript project
- `pnpm lint` - Run ESLint
- `pnpm prettier` - Check code formatting
- `pnpm fix` - Fix linting and formatting issues

## Project Structure

```text
src/
├── index.ts              # Main server entry point
├── lib/
│   ├── caniuse-api.ts    # Caniuse API client
│   ├── caniuse-db.ts     # Data processing utilities
│   ├── consts.ts         # Constants and configuration
│   └── mdn.ts            # MDN compatibility data
└── tools/
    ├── index.ts          # Tools registry
    ├── registry.ts       # Tool registration system
    ├── caniuse/
    │   ├── index.ts      # Caniuse feature lookup tool
    │   └── schema.ts     # Input validation schemas
    └── list-tools/
        └── index.ts      # Tools listing functionality
```

## API Reference

### Tool: caniuse_feature

Fetches compatibility data for a specified web feature.

**Input Schema:**

```typescript
{
  feature: string // Feature name to look up
}
```

**Output:**

- Comprehensive browser support information
- Version-specific compatibility data
- Implementation notes and caveats
- Polyfill availability information

### Tool: list_tools

Lists all available tools in the MCP server.

**Input Schema:**

```typescript
{} // No parameters required
```

**Output:**

- Tool names and descriptions
- Usage information
- Available functionality overview

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License

## Data Sources

This MCP server combines compatibility data from multiple authoritative sources:

- **[Caniuse.com](https://caniuse.com/)** - Comprehensive browser support tables for web technologies
- **[MDN Browser Compatibility Data](https://github.com/mdn/browser-compat-data)** - Mozilla's detailed compatibility database

By leveraging both data sources, the server provides more complete and accurate browser compatibility information for web developers.

## References

- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP specification
- [FastMCP](https://github.com/jsparkdev/fastmcp) for the MCP server framework
- [MCP Client Feature support matrix](https://modelcontextprotocol.io/clients)

---

Made with ❤️ by [yujeongJeon](https://github.com/yujeongJeon)
