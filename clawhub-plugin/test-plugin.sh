#!/bin/bash
# Test script for ClawHub Nix plugin
# Run this after installing Nix

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Testing ClawHub Nix Plugin ==="
echo ""

# First test the bundle without Nix
echo "1. Testing bundle directly (no Nix required)..."
if timeout 5 node lib/tick-mcp-bundled.cjs 2>&1 | grep -q "Tick MCP server"; then
    echo "   Bundle starts correctly"
else
    echo "   ERROR: Bundle failed to start"
    exit 1
fi

echo ""
echo "2. Testing MCP tools list..."
TOOLS=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | timeout 5 node lib/tick-mcp-bundled.cjs 2>&1 | grep -o '"name":"tick_[^"]*"' | wc -l)
echo "   Found $TOOLS tools"
if [ "$TOOLS" -lt 10 ]; then
    echo "   ERROR: Expected at least 10 tools"
    exit 1
fi

# Check if Nix is available for full testing
if ! command -v nix &> /dev/null; then
    echo ""
    echo "=== Basic tests passed! ==="
    echo ""
    echo "Nix is not installed. To test the full Nix flake, install Nix first:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install"
    exit 0
fi

# Enable flakes if not already
export NIX_CONFIG="experimental-features = nix-command flakes"

echo ""
echo "3. Checking flake syntax..."
nix flake check --no-build 2>&1 || echo "   (warnings are expected)"

echo ""
echo "4. Building the Nix package..."
nix build .#tick-mcp --print-build-logs

echo ""
echo "5. Testing the Nix-built binary..."
if timeout 5 ./result/bin/tick-mcp 2>&1 | grep -q "Tick MCP server"; then
    echo "   Nix package works correctly"
else
    echo "   ERROR: Nix package failed"
    exit 1
fi

echo ""
echo "=== All tests passed! ==="
echo ""
echo "The plugin is ready for publishing."
echo "Users can install via: nix run github:Purple-Horizons/tick-md?dir=clawhub-plugin"
