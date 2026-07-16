import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "ChronoLegal SA — Find Contradictions Before Opposing Counsel Does",
  description: "AI medico-legal chronology for SA RAF and personal injury attorneys. Flag GCS contradictions, expert report discrepancies, and treatment gaps in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}