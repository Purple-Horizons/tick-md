import type { Metadata } from "next";
import TickLanding from "@/components/TickLanding";

export const metadata: Metadata = {
  title: "TICK.md — Multi-Agent Task Coordination via Markdown",
  description: "Open source protocol for AI agents and humans to coordinate work through Git-backed Markdown. Free CLI, dashboard, and MCP server. No vendor lock-in.",
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TICK.md",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Cross-platform",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: "Open source multi-agent task coordination protocol. CLI, dashboard, and MCP server for AI agents and humans to coordinate work through Git-backed Markdown.",
  url: "https://tick.md",
  downloadUrl: "https://www.npmjs.com/package/tick-md",
  softwareVersion: "1.0.0",
  author: {
    "@type": "Organization",
    name: "Purple Horizons",
    url: "https://github.com/Purple-Horizons",
  },
  license: "https://opensource.org/licenses/MIT",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TickLanding />
    </>
  );
}
