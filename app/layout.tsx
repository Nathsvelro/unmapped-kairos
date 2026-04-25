import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unmapped Kairos — Real skills, real opportunity",
  description:
    "Open, localizable infrastructure that connects a young person's real skills to real economic opportunity. Infrastructure, not an app.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Google Fonts loaded via <link> rather than next/font/google so the
            production build doesn't fail when the fetch is unreachable.
            Falls back to system stacks declared in globals.css. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
