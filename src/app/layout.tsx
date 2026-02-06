"use client";
import type { Metadata } from "next";
import { Fira_Code} from "next/font/google";
import "./globals.css";
import { useEffect } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";

    if (savedTheme !== "light") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body className={firaCode.className}>
        {children}
      </body>
    </html>
  );
}
