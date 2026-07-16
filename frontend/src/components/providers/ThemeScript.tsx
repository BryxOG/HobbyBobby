/**
 * Applies the persisted theme before first paint.
 *
 * The zustand store only rehydrates after React mounts, which is one frame too
 * late — without this the app flashes light before switching to dark.
 * Key/shape must stay in sync with `useSettings`' persist config.
 */
const script = `
(function () {
  try {
    var raw = localStorage.getItem("hb-settings");
    var theme = raw ? JSON.parse(raw).state.theme : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return (
    <script
      // Runs before hydration; the content is a static literal, no user input.
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
