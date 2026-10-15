import type { Metadata } from "next";
import { LossLabSessionProvider } from "@/lib/session";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LossLab — AI Agent Risk Engineering",
  description: "Deterministic synthetic financial exposure testing for autonomous business agents.",
  applicationName: "LossLab",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LossLabSessionProvider>{children}</LossLabSessionProvider></body></html>;
}
