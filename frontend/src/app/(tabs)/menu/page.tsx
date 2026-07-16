"use client";

import { useMe } from "@/lib/api/hooks";
import { ru } from "@/lib/i18n/ru";
import { useSettings } from "@/lib/stores/settings";
import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/ui/Header";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Skeleton } from "@/components/ui/States";

export default function MenuPage() {
  const { data: me } = useMe();
  const theme = useSettings((s) => s.theme);
  const toggleTheme = useSettings((s) => s.toggleTheme);

  return (
    <>
      <Header
        title={ru.menu.title}
        large
        trailing={
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? ru.menu.themeLight : ru.menu.themeDark}
            className="grid size-9 place-items-center rounded-full text-[18px] active:scale-90"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        }
      />

      <main className="flex-1 space-y-6 px-4 py-3">
        <section className="flex items-center gap-3 rounded-card bg-surface p-3">
          {me ? (
            <>
              <Avatar user={me} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[19px] font-semibold">{me.name}</p>
                <p className="truncate text-[14px] text-fg-muted">{me.email}</p>
                <p className="text-[13px] text-fg-muted">
                  {me.level} {ru.profile.level}
                  {me.rating != null && ` · ${me.rating}/5⭐`}
                </p>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </>
          )}
        </section>

        <ListGroup>
          <ListRow icon="👤" label={ru.menu.profile} href="/menu/profile" />
          <ListRow icon="🎉" label={ru.menu.myEvents} href="/menu/my-events" />
          <ListRow icon="🤔" label={ru.menu.interests} href="/menu/interests" />
          <ListRow icon="⚙️" label={ru.menu.settings} href="/menu/settings" />
        </ListGroup>

        <ListGroup>
          <ListRow
            icon="😭"
            label={ru.menu.logout}
            danger
            // Auth lands with UserService; the row exists so the flow is complete.
            onClick={() => alert("Аутентификация появится вместе с UserService")}
          />
        </ListGroup>
      </main>
    </>
  );
}
