import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Night Clock",
    short_name: "Night Clock",
    description: "A customisable bedside night clock",
    start_url: ".",
    scope: ".",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone"],
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    orientation: "any",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
