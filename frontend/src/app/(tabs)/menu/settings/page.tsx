"use client";

import { ru } from "@/lib/i18n/ru";
import { useSettings } from "@/lib/stores/settings";
import { useAuth } from "@/lib/stores/auth";
import { disableWebPush, enableWebPush } from "@/lib/push/fcm";
import { Header } from "@/components/ui/Header";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Toggle } from "@/components/ui/Toggle";
import { InstallRow } from "@/components/pwa/InstallRow";

export default function SettingsPage() {
  const userId = useAuth((s) => s.userId);
  const {
    notifications,
    geolocation,
    theme,
    setNotifications,
    setGeolocation,
    toggleTheme,
  } = useSettings();

  const handleNotifications = async (on: boolean) => {
    setNotifications(on);
    if (!userId) return;
    try {
      if (on) {
        await enableWebPush(userId);
      } else {
        await disableWebPush(userId);
      }
    } catch (error) {
      console.error("Не удалось настроить push-уведомления", error);
    }
  };

  return (
    <>
      <Header title={ru.settings.title} back="/menu" />

      <main className="flex-1 space-y-6 px-4 py-4">
        <ListGroup>
          <ListRow
            icon="🔔"
            label={ru.settings.notifications}
            hint={ru.settings.notificationsHint}
            trailing={
              <Toggle
                checked={notifications}
                onChange={handleNotifications}
                label={ru.settings.notifications}
              />
            }
          />
          <ListRow
            icon="📍"
            label={ru.settings.geolocation}
            hint={ru.settings.geolocationHint}
            trailing={
              <Toggle
                checked={geolocation}
                onChange={setGeolocation}
                label={ru.settings.geolocation}
              />
            }
          />
        </ListGroup>

        <ListGroup>
          <ListRow
            icon={theme === "dark" ? "🌙" : "☀️"}
            label={ru.settings.theme}
            value={theme === "dark" ? "Тёмная" : "Светлая"}
            onClick={toggleTheme}
            trailing={
              <Toggle
                checked={theme === "dark"}
                onChange={toggleTheme}
                label={ru.settings.theme}
              />
            }
          />
          <ListRow icon="🌐" label={ru.settings.language} value="RU" />
        </ListGroup>

        <ListGroup>
          <InstallRow />
        </ListGroup>
      </main>
    </>
  );
}
