import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blockwise — Your block. Your voice.",
  description:
    "Prepare a clear neighborhood issue report for potholes, damaged sidewalks, and streetlights in Portland, Oregon. Review every detail before taking the next step.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
