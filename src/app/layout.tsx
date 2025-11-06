import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ActiveTeamProvider } from "./_context/ActiveTeamContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clario",
  description:
    "AI-powered documentation and diagramming tool for engineering teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <link rel="icon" type="image/png" href="favico.png" />

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ActiveTeamProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ActiveTeamProvider>
      </body>
    </html>
  );
}
