import { Suspense } from "react";
import { TopBar } from "./TopBar";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <Suspense fallback={<aside className="w-72 border-l border-border bg-surface" />}>
          <CollapsibleSidebar />
        </Suspense>
      </div>
    </div>
  );
}
