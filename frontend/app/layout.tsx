import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { PageTitleManager } from "@/components/PageTitleManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workbudd",
  description: "Workbudd platform",
  icons: {
    icon: {
      url: "/favi.png",
      href: "/favi.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <NotificationProvider>
            <ToastProvider>
              <PageTitleManager />
              {children}
            </ToastProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  );
}
