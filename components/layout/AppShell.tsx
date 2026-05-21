import { Suspense } from "react";
import { TopBar } from "./TopBar";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Suspense
          fallback={
            <aside className="w-72 shrink-0 border-r border-border bg-surface" />
          }
        >
          <CollapsibleSidebar />
        </Suspense>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
