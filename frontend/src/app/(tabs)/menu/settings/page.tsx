"use client";

import { ru } from "@/lib/i18n/ru";
import { useSettings } from "@/lib/stores/settings";
import { Header } from "@/components/ui/Header";
import { ListGroup, ListRow } from "@/components/ui/List";
import { Toggle } from "@/components/ui/Toggle";
import { InstallRow } from "@/components/pwa/InstallRow";

export default function SettingsPage() {
  const {
    notifications,
    geolocation,
    theme,
    setNotifications,
    setGeolocation,
    toggleTheme,
  } = useSettings();

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
                onChange={setNotifications}
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
          {/* Only RU exists today; the row is live so adding a locale is visible. */}
          <ListRow icon="🌐" label={ru.settings.language} value="RU" />
        </ListGroup>

        <ListGroup>
          <InstallRow />
        </ListGroup>
      </main>
    </>
  );
}
