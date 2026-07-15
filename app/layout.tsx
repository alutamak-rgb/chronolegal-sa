import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronoLegal AI — SA Medico-Legal Chronology",
  description: "AI-powered comparative analysis for RAF and personal injury plaintiff attorneys. Find contradictions in medical records before trial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
