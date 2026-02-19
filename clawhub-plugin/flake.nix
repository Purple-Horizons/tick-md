{
  description = "Tick multi-agent coordination for OpenClaw";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      version = "1.3.0";

      # Pre-built MCP server bundle (included in plugin directory)
      mcpBundle = ./lib/tick-mcp-bundled.cjs;

      # Create the tick-mcp package
      buildTickMcp = pkgs: pkgs.writeShellScriptBin "tick-mcp" ''
        exec ${pkgs.nodejs_20}/bin/node ${mcpBundle} "$@"
      '';
    in
    {
      # OpenClaw plugin format
      openclawPlugin = {
        name = "tick-coordination";
        inherit version;

        # Packages for each supported system
        packages = forAllSystems (pkgs: [
          (buildTickMcp pkgs)
        ]);

        # Skill files to include
        skills = [ ./skills/tick-coordination ];
      };

      # Also expose as a regular Nix package for testing
      packages = forAllSystems (pkgs: {
        default = buildTickMcp pkgs;
        tick-mcp = buildTickMcp pkgs;
      });

      # Allow running directly: nix run github:Purple-Horizons/tick-md?dir=clawhub-plugin
      apps = forAllSystems (pkgs: {
        default = {
          type = "app";
          program = "${self.packages.${pkgs.system}.tick-mcp}/bin/tick-mcp";
        };
      });
    };
}
