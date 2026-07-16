"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ru } from "@/lib/i18n/ru";

interface Tab {
  href: string;
  label: string;
  icon: (props: IconProps) => React.JSX.Element;
  /** The centre "+" — rendered as a filled square, not a labelled icon. */
  primary?: boolean;
}

/**
 * Bottom navigation. Targets come from the sketch's arrows, which fan out from
 * the five nav icons to: Ивенты, Чаты, Создать(+), Карта, Профиль.
 */
const TABS: Tab[] = [
  { href: "/events", label: ru.tabs.events, icon: TicketIcon },
  { href: "/chats", label: ru.tabs.chats, icon: ChatIcon },
  { href: "/create", label: ru.tabs.create, icon: PlusIcon, primary: true },
  { href: "/map", label: ru.tabs.map, icon: MapIcon },
  { href: "/menu", label: ru.tabs.menu, icon: PersonIcon },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ru.tabs.events}
      className={cn(
        "sticky bottom-0 z-40 border-t border-border bg-tabbar backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <li key={tab.href} className="flex flex-1 justify-center">
                <Link
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center justify-center py-1.5"
                >
                  <span
                    className={cn(
                      "grid size-11 place-items-center rounded-2xl bg-primary text-primary-fg",
                      "transition-transform duration-100 active:scale-90",
                    )}
                  >
                    <Icon className="size-6" />
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 transition-colors",
                  active ? "text-primary" : "text-fg-muted",
                )}
              >
                <Icon className="size-6" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function TicketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5Z" />
      <path d="M14 6v12" strokeDasharray="2 2.5" />
    </svg>
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M20 12a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.4-.3-3.4-.8L4 20l1.4-4.2A7.5 7.5 0 1 1 20 12Z" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke} strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M9 3.5 4 5.6v14.9l5-2.1 6 2.1 5-2.1V3.5l-5 2.1-6-2.1Z" />
      <path d="M9 3.5v14.9M15 5.6v14.9" />
    </svg>
  );
}

function PersonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
