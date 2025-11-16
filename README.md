# 📊 Caniuse MCP

[![npm version](https://img.shields.io/npm/v/caniuse-mcp.svg)](https://www.npmjs.com/package/caniuse-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server providing browser compatibility data and web API support information using the caniuse.com database.

## Features

- **Multiple Data Sources**: Combines data from CanIUse, MDN BCD, and Web Features for comprehensive compatibility information
- **Browser Compatibility Data**: Get detailed compatibility information for web features across all major browsers
- **Baseline Status**: See Web Features baseline status (high/low) for modern browser support
- **Feature Search**: Look up web features by name using comprehensive databases
- **Always Up-to-Date**: Queries the latest compatibility data in real-time
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

Returns detailed compatibility information from multiple sources:

**CanIUse Data:**

- Support status for major browsers: Chrome, Firefox, Safari, Edge, iOS Safari, Chrome Android
- Version-specific support information
- Partial support details
- Notes about implementation differences
- Polyfill availability

**Web Features Data:**

- Baseline status (high/low/false) indicating cross-browser support maturity
- Related MDN documentation IDs
- Specification links
- Modern browser support information

**MDN Browser Compatibility Data:**

- Detailed API/feature support
- Experimental and deprecated status
- Standard track information

#### 2. `browserslist_compatibility_check`

Check web feature compatibility against your browserslist configuration.

**Parameters:**

- `feature` (string): The feature to check compatibility for
- `browserslistQuery` (string, optional): Browserslist query string (e.g., "> 1%, last 2 versions")
- `configPath` (string, optional): Path to .browserslistrc file
- `projectPath` (string, optional): Path to project root with package.json or .browserslistrc

**Example:**

```text
Check if array.at is compatible with my browserslist config: ">= 1%, not dead, Chrome >= 106, ios_saf >= 16"
```

**Response:**

Returns compatibility results filtered by your target browsers:

- Target browser list from your browserslist query
- Feature support status for each target browser version
- Identifies compatibility issues with specific browser versions
- Combines data from CanIUse, MDN BCD, and Web Features

**Use Cases:**

- Validate new web features against your project's browser support policy
- Check if a feature works in your target browsers before using it
- Analyze compatibility with company-specific browserslist configurations
- Ensure features work in specific browser version ranges

#### 3. `list_tools`

List all available tools and their descriptions.

**Example Response:**

```text
# Available Tools in caniuse-mcp

## caniuse-feature
Look up the compatibility of web features across different browsers using data from caniuse.com.

## browserslist-compatibility-check
Check web feature compatibility against your browserslist configuration.

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
│   ├── browserslist.ts   # Browserslist query parser
│   ├── caniuse-api.ts    # Caniuse API client
│   ├── caniuse-db.ts     # Data processing utilities
│   ├── compat-utils.ts   # Multi-source compatibility data aggregation
│   ├── consts.ts         # Constants and configuration
│   ├── mdn.ts            # MDN compatibility data
│   └── web-features.ts   # Web Features baseline data
└── tools/
    ├── index.ts          # Tools registry
    ├── registry.ts       # Tool registration system
    ├── browserslist-compat/
    │   ├── index.ts      # Browserslist compatibility
    │   └── schema.ts     # Input validation schemas
    ├── caniuse/
    │   ├── index.ts      # Multi-source feature 
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

### Tool: browserslist_compatibility_check

Checks web feature compatibility against browserslist configuration.

**Input Schema:**

```typescript
{
  feature: string // Feature name to check
  browserslistQuery?: string // Browserslist query string
  configPath?: string // Path to .browserslistrc file
  projectPath?: string // Path to project root
}
```

**Output:**

- Target browser list from browserslist query
- Feature support status filtered by target browsers
- Compatibility issues with specific browser versions
- Combined data from CanIUse, MDN BCD, and Web Features

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
- **[Web Features](https://github.com/web-platform-dx/web-features)** - Baseline status and cross-browser feature availability
- **[MDN Browser Compatibility Data](https://github.com/mdn/browser-compat-data)** - Mozilla's detailed compatibility database

By leveraging these three complementary data sources, the server provides the most complete and accurate browser compatibility information for web developers:

- **CanIUse** provides detailed version-by-version support history
- **Web Features** offers baseline status to quickly understand cross-browser maturity
- **MDN BCD** adds specification details and experimental/deprecated flags

## References

- [Model Context Protocol](https://github.com/modelcontextprotocol) for the MCP specification
- [FastMCP](https://github.com/jsparkdev/fastmcp) for the MCP server framework
- [MCP Client Feature support matrix](https://modelcontextprotocol.io/clients)

---

Made with ❤️ by [yujeongJeon](https://github.com/yujeongJeon)
