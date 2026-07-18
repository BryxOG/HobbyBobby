import type { Metadata, Viewport } from "next";
import { getYandexMapsScriptUrl, YANDEX_MAPS_SCRIPT_ID } from "@/components/map/yandexMapsConfig";
import { Providers } from "@/components/providers/Providers";
import { ThemeScript } from "@/components/providers/ThemeScript";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";
import "./globals.css";

const yandexMapsApiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

export const metadata: Metadata = {
  title: "HobbyBobby",
  description:
    "Находите людей по интересам рядом с вами, создавайте ивенты и играйте вместе.",
  applicationName: "HobbyBobby",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HobbyBobby",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  other: {
    // Next emits the standardised `mobile-web-app-capable`. iOS below 15.4
    // reads only the apple-prefixed name, and without it those devices open
    // the installed app in a Safari chrome instead of standalone.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // An installed app shouldn't pinch-zoom like a document.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {yandexMapsApiKey ? (
          <script
            id={YANDEX_MAPS_SCRIPT_ID}
            src={getYandexMapsScriptUrl(yandexMapsApiKey)}
            async
          />
        ) : null}
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <Providers>{children}</Providers>
        <ServiceWorker />
      </body>
    </html>
  );
}
