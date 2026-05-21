import Image from "next/image";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/reportly-logo.svg"
            alt="Reportly.io"
            width={160}
            height={32}
            priority
          />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/assessments/new"
            className="btn-primary hidden sm:inline-flex"
          >
            New assessment
          </Link>
          <Link href="/settings" className="btn-secondary">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
