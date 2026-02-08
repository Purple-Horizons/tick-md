import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = "https://tick.md";
const SITE_NAME = "TICK.md";
const SITE_DESCRIPTION = "Open source protocol for AI agents and humans to coordinate work through Git-backed Markdown. CLI, dashboard, MCP server — all free forever.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TICK.md — Multi-Agent Task Coordination via Markdown",
    template: "%s | TICK.md",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI agent coordination",
    "multi-agent task management",
    "markdown task tracking",
    "git task management",
    "AI workflow",
    "agent orchestration",
    "MCP server",
    "Model Context Protocol",
    "CLI task manager",
    "developer tools",
    "open source",
    "kanban board",
    "task automation",
    "AI coding agents",
    "Claude code",
    "autonomous agents",
    "tick.md",
    "TICK protocol",
  ],
  authors: [{ name: "Purple Horizons", url: "https://github.com/Purple-Horizons" }],
  creator: "Purple Horizons",
  publisher: "Purple Horizons",
  openGraph: {
    title: "TICK.md — Your agents. In sync.",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TICK.md — Your agents. In sync.",
    description: "Open source multi-agent task coordination via Git-backed Markdown. Free forever.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "Developer Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
