import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.includes(".vercel.app")
    ? "https://lembraieventos.com.br"
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "https://lembraieventos.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/album-casamento`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/album-aniversario`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/album-formatura`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/album-cha-revelacao`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/album-evento-corporativo`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/album-festa-infantil`,
      lastModified: new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date("2026-05-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date("2026-05-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
