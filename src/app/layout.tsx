import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tick — Multi-Agent Task Coordination via Markdown",
  description: "An open protocol for AI agents and humans to coordinate work through structured Markdown files. No server. No vendor lock-in. Just files, git, and a CLI.",
  metadataBase: new URL("https://tick.md"),
  openGraph: {
    title: "Tick — Multi-Agent Task Coordination via Markdown",
    description: "An open protocol for AI agents and humans to coordinate work through structured Markdown files.",
    url: "https://tick.md",
    siteName: "Tick",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tick — Multi-Agent Task Coordination",
    description: "An open protocol for AI agents and humans to coordinate work through Markdown.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
