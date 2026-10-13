import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "ProposalAI - Win More Freelance Jobs",
    template: "%s | ProposalAI",
  },
  description: "AI-powered freelance proposal generator. Tailored proposals, job analysis, and honest scoring for Upwork, Fiverr, and Freelancer.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
      </body>
    </html>
  );
}