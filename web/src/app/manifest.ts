import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Tribün",
        short_name: "Tribün",
        description:
            "Futbol bilgini test et ve diğer taraftarlarla yarış.",
        start_url: "/",
        display: "standalone",
        background_color: "#09090b",
        theme_color: "#09090b",
        lang: "tr",
    };
}