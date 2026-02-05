import type { Metadata } from "next";
import { Fira_Code} from "next/font/google";
import "./globals.css";

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "natan.sh",
  description: "natan.sh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
