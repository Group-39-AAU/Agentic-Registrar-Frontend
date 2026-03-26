import type { Metadata } from "next";
import "./globals.css";
import { Open_Sans } from 'next/font/google'

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: "AAU | Addis Ababa University",
  description: "Addis Ababa University is a public university in Addis Ababa, Ethiopia. It is the oldest and largest university in Ethiopia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
