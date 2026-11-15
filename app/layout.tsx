import type { Metadata } from "next";
import "./globals.css";
import { themeScript } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/toast";

const inter = { variable: "--font-inter", className: "font-sans" };

export const metadata: Metadata = {
  title: "Nexus OS | One Platform. One Workspace.",
  description: "The Company Operating System — everything your business needs in one premium workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
