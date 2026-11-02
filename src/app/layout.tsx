import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripSplit — หารค่าใช้จ่ายทริป",
  description: "คำนวณรายจ่ายต่อคนสำหรับการเดินทาง ง่าย ไม่ต้องสมัครบัญชี",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "TripSplit",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // lets env(safe-area-inset-*) report the notch and home indicator
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
