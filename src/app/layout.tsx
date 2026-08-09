import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: { default: "2027 中歐旅行", template: "%s｜2027 中歐旅行" },
  description: "布拉格、CK、薩爾斯堡、湖區、布達佩斯與維也納的共同旅行工作台。",
  applicationName: "中歐旅行",
};

export const viewport: Viewport = { themeColor: "#f5f5f2", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body><Providers>{children}</Providers></body></html>;
}
