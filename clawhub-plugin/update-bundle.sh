#!/bin/bash
# Update the pre-built bundle in clawhub-plugin/lib/
# Run this after making changes to the MCP server

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building MCP bundle..."
cd "$REPO_ROOT/mcp"
npm run build:bundle

echo "Copying bundle to plugin..."
cp dist/tick-mcp-bundled.cjs "$SCRIPT_DIR/lib/"

echo "Bundle updated: $SCRIPT_DIR/lib/tick-mcp-bundled.cjs"
echo ""
echo "Bundle size: $(wc -c < "$SCRIPT_DIR/lib/tick-mcp-bundled.cjs" | tr -d ' ') bytes"
echo ""
echo "Don't forget to commit the updated bundle!"
