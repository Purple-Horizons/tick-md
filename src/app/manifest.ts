import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TICK.md Dashboard",
    short_name: "TICK",
    description: "Local-first multi-agent coordination dashboard for TICK.md",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a12",
    theme_color: "#a78bfa",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

