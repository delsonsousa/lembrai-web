import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembrai.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/checkout", "/login", "/register", "/privacy", "/terms"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/account",
          "/verify-email",
          "/checkout/success",
          "/terms/accept",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
