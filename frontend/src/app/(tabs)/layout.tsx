import { TabBar } from "@/components/layout/TabBar";

/**
 * The five-tab shell. Everything reachable from the bottom bar lives in here;
 * the tab bar itself is outside the scroll area so it never scrolls away.
 */
export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        {children}
      </div>
      <TabBar />
    </div>
  );
}
