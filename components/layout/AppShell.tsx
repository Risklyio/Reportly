import { Suspense } from "react";
import { TopBar } from "./TopBar";
import { CollapsibleSidebar } from "./CollapsibleSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <TopBar />
      <div className="flex flex-1 overflow-hidden bg-app">
        <Suspense
          fallback={
            <aside className="w-72 shrink-0 border-r border-neutral-800 bg-sidebar" />
          }
        >
          <CollapsibleSidebar />
        </Suspense>
        <main className="min-w-0 flex-1 overflow-y-auto bg-app">{children}</main>
      </div>
    </div>
  );
}
