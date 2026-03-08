import { supabase } from "@/lib/supabase";
import { articles } from "@/lib/blog";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://place65plus.quebec";

  // Fetch all residence IDs and last update
  const { data: residences } = await supabase
    .from("residences")
    .select("id, updated_at, ville, region");

  const residenceUrls: MetadataRoute.Sitemap = (residences ?? []).map((r) => ({
    url: `${baseUrl}/residence/${r.id}`,
    lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Unique cities
  const villes = [...new Set((residences ?? []).map((r) => r.ville).filter(Boolean))];
  const villeUrls: MetadataRoute.Sitemap = villes.map((ville) => ({
    url: `${baseUrl}/recherche?q=${encodeURIComponent(ville!)}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogUrls: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((a) => ({
      url: `${baseUrl}/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/recherche`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/carte`, changeFrequency: "weekly", priority: 0.5 },
    ...blogUrls,
    ...villeUrls,
    ...residenceUrls,
  ];
}
