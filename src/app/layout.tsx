import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Aspis by CyberShield | Security Posture Management",
  description: "Continuous security posture monitoring for M365, Salesforce, and cloud infrastructure. A CyberShield Technologies product.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} ${ibmMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--ink)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
        {children}
      </body>
    </html>
  );
}
