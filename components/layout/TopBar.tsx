"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const LOGO_SRC = "/brand/reportly-logo.png?v=4";
const ICON = "h-[22px] w-[22px] text-text";

function IconMenu() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="h-5 w-5 shrink-0 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconFileStack() {
  return (
    <svg className="h-5 w-5 shrink-0 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="h-5 w-5 shrink-0 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const MENU_ITEMS = [
  { href: "/assessments/new", label: "New Assessment", Icon: IconPlus },
  { href: "/settings#report-templates", label: "Templates", Icon: IconFileStack },
  { href: "/settings", label: "Settings", Icon: IconSettings },
] as const;

export function TopBar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-topbar">
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
            className="h-11 w-auto max-w-[260px] object-contain object-left"
          />
        </Link>

        <div ref={menuRef} className="relative flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {/* Slide-out items (visible when open) */}
          <nav
            className={`flex items-center gap-1 overflow-hidden transition-all duration-200 ease-in-out ${
              open ? "mr-2 max-w-[500px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-text transition hover:bg-muted"
              >
                <item.Icon />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger / close button */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text transition hover:bg-muted"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
