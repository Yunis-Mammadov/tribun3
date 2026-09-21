import type { MetadataRoute } from "next";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: siteUrl,
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${siteUrl}/oyunlar`,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${siteUrl}/oyunlar/ne-kadar-taraftarsin`,
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${siteUrl}/oyunlar/golu-kim-atmisti`,
            changeFrequency: "weekly",
            priority: 0.8,
        },
    ];
}