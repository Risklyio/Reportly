import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeScript } from "@/components/theme/ThemeScript";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Reportly.io — M365 Compliance Reporting",
  description:
    "Automate M365 Application Compliance Program audit and review reporting.",
  icons: {
    icon: [{ url: "/brand/reportly-favicon.png?v=2", type: "image/png" }],
    shortcut: [{ url: "/brand/reportly-favicon.png?v=2", type: "image/png" }],
    apple: [{ url: "/brand/reportly-favicon.png?v=2", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="icon" type="image/png" href="/brand/reportly-favicon.png?v=2" />
        <link rel="shortcut icon" href="/brand/reportly-favicon.png?v=2" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
