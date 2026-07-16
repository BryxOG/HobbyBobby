import type { Metadata } from "next";

export const metadata: Metadata = { title: "Нет сети — HobbyBobby" };

/** Served by the service worker when a navigation fails with no cached copy. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-8 text-center">
      <span aria-hidden className="text-[44px]">
        📡
      </span>
      <h1 className="text-[22px] font-bold tracking-tight">Нет подключения</h1>
      <p className="text-[15px] text-balance text-fg-muted">
        Проверьте интернет — открытые ранее экраны продолжат работать.
      </p>
    </main>
  );
}
