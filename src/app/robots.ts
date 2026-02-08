import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://tick-md.vercel.app/sitemap.xml",
  };
}
