import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/dashboard`, lastModified },
    { url: `${baseUrl}/setting`, lastModified },
    { url: `${baseUrl}/signin`, lastModified },
    { url: `${baseUrl}/signup`, lastModified },
    { url: `${baseUrl}/forgot-password`, lastModified },
    { url: `${baseUrl}/reset-password`, lastModified },
    { url: `${baseUrl}/two-step-verification`, lastModified },
    { url: `${baseUrl}/verify-email`, lastModified },
  ];
}
