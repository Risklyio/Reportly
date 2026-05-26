import Link from "next/link";

/** Bump when replacing public/brand/reportly-logo.png to bust CDN/browser cache */
const LOGO_SRC = "/brand/reportly-logo.png?v=3";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-topbar">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Reportly.io"
            width={200}
            height={44}
            decoding="async"
            fetchPriority="high"
            className="h-9 w-auto max-w-[220px] object-contain object-left"
          />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/assessments/new"
            className="btn-topbar hidden sm:inline-flex"
          >
            New assessment
          </Link>
          <Link
            href="/settings#report-templates"
            className="btn-topbar-ghost hidden md:inline-flex"
          >
            Templates
          </Link>
          <Link href="/settings" className="btn-topbar-ghost">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
