import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConsensusAI - Multi-Agent Negotiation",
  description: "Decision Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
