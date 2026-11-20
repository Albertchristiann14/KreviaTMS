import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: {
    default: "Krevia TMS",
    template: "%s | Krevia TMS",
  },
  applicationName: "Krevia TMS",
  description:
    "Krevia Team Management System — Unified Tasks, Team & KPI Evaluation, Social Media & Design Operations",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Krevia Team Management System (KTMS)",
    description:
      "Sistem Manajemen Operasional Internal Krevia Digital — Proyek, Kanban, Media Sosial, Desain, dan Evaluasi KPI.",
    type: "website",
    siteName: "Krevia TMS",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
