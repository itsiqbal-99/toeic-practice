import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/source-serif-4/400.css";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: {
    default: "TOEIC Practice · Your learning workspace",
    template: "%s · TOEIC Practice",
  },
  description:
    "A personal workspace for thoughtful English practice. Listening, reading, and progress you can understand.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
