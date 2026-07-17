"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, qk } from "@/lib/api/hooks";
import { USING_MOCKS } from "@/lib/api/client";
import { ru } from "@/lib/i18n/ru";
import { useAuth } from "@/lib/stores/auth";
import { useSettings } from "@/lib/stores/settings";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Skeleton } from "@/components/ui/States";

export default function MenuPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuth((s) => s.userId);
  const logout = useAuth((s) => s.logout);
  const isLoggedIn = USING_MOCKS || Boolean(userId);
  const { data: me, isPending } = useMe();
  const theme = useSettings((s) => s.theme);
  const toggleTheme = useSettings((s) => s.toggleTheme);

  function handleLogout() {
    logout();
    qc.removeQueries({ queryKey: qk.me });
    router.push("/login");
  }

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
          {isLoggedIn && isPending ? (
            <>
              <Skeleton className="size-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </>
          ) : isLoggedIn && me ? (
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
            <div className="flex w-full flex-col items-center gap-3 py-2 text-center">
              <p className="text-[15px] text-fg-muted">{ru.menu.loginPrompt}</p>
              <div className="flex w-full gap-2">
                <Button className="flex-1" onClick={() => router.push("/login")}>
                  {ru.menu.login}
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => router.push("/register")}
                >
                  {ru.auth.register}
                </Button>
              </div>
            </div>
          )}
        </section>

        <ListGroup>
          <ListRow
            icon="👤"
            label={ru.menu.profile}
            href={isLoggedIn ? "/menu/profile" : "/login"}
          />
          <ListRow
            icon="🎉"
            label={ru.menu.myEvents}
            href={isLoggedIn ? "/menu/my-events" : "/login"}
          />
          <ListRow icon="🤔" label={ru.menu.interests} href="/menu/interests" />
          <ListRow icon="⚙️" label={ru.menu.settings} href="/menu/settings" />
        </ListGroup>

        {isLoggedIn && (
          <ListGroup>
            <ListRow
              icon="😭"
              label={ru.menu.logout}
              danger
              onClick={handleLogout}
            />
          </ListGroup>
        )}
      </main>
    </>
  );
}
