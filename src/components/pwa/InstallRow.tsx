"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ru } from "@/lib/i18n/ru";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/List";

/** Not in lib.dom yet — Chromium-only, and the whole point of this component. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const noopSubscribe = () => () => {};

/** Reads a browser fact without mirroring it into state via an effect. */
function useStandalone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(display-mode: standalone)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false, // The server can't know; assume browser tab.
  );
}

function useIsIOS(): boolean {
  return useSyncExternalStore(
    noopSubscribe, // The user agent never changes mid-session.
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );
}

/**
 * "Установить приложение" — the PWA install entry point.
 *
 * Chromium fires `beforeinstallprompt` and lets us open the native sheet.
 * Safari/iOS never fires it, so there we point at Share → "На экран «Домой»",
 * which is the only install path Apple allows.
 */
export function InstallRow() {
  const standalone = useStandalone();
  const isIOS = useIsIOS();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault(); // Suppress the mini-infobar; we place the CTA ourselves.
      setPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      // display-mode doesn't flip for the tab that triggered the install.
      setJustInstalled(true);
      setPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || justInstalled) {
    return <ListRow icon="✅" label="Приложение установлено" />;
  }

  if (isIOS) {
    return (
      <ListRow
        icon="📲"
        label={ru.settings.install}
        hint="Поделиться → На экран «Домой»"
      />
    );
  }

  return (
    <ListRow
      icon="📲"
      label={ru.settings.install}
      hint={ru.settings.installHint}
      trailing={
        <Button
          size="sm"
          disabled={!prompt}
          onClick={async () => {
            if (!prompt) return;
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null); // The event is single-use.
          }}
        >
          {ru.settings.install}
        </Button>
      }
    />
  );
}
