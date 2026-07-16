import type { MetadataRoute } from "next";

/**
 * Makes the app installable on Android, iOS and desktop — the PWA route the
 * spec chose instead of native clients.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HobbyBobby — ивенты по интересам",
    short_name: "HobbyBobby",
    description:
      "Находите людей по интересам рядом с вами, создавайте ивенты и играйте вместе.",
    start_url: "/events",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ru",
    dir: "ltr",
    categories: ["social", "sports", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Карта", url: "/map" },
      { name: "Создать ивент", url: "/create" },
      { name: "Чаты", url: "/chats" },
    ],
  };
}
