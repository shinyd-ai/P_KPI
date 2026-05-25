import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stride KPI",
    short_name: "Stride",
    description: "Personal KPI, goal, plan, and daily log tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icons/stride-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/stride-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/stride-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
