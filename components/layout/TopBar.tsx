import Image from "next/image";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-topbar">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/reportly-logo.svg"
            alt="Reportly.io"
            width={180}
            height={40}
            priority
            className="h-9 w-auto"
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
