import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark, neobrutalism, shadesOfPurple } from "@clerk/themes";
import { CreditsProvider } from "@/context/CreditsContext";

export const metadata: Metadata = {
  title: "CrawlCube",
  description: "Generate professional websites in seconds with AI",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        {/* ── 🔤 FONTSHARE — Change this URL to swap fonts app-wide ── */}
        <head>
          <link
            href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&f[]=clash-display@400,500,600,700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://api.fontshare.com/v2/css?f[]=boska@400,500,700,900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <CreditsProvider>{children}</CreditsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
