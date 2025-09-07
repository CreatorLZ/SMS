// Basic PWA config for offline classroom use
export const pwaConfig = {
  registerType: "autoUpdate",
  manifest: {
    name: "Treasure Land School",
    short_name: "TreasureLand",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/treasure.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/treasure.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};
