import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.includes(".vercel.app")
    ? "https://lembraieventos.com.br"
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "https://lembraieventos.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/contact", "/login", "/register", "/privacy", "/terms"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/account",
          "/checkout",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/terms/accept",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
