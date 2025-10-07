import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: "Home",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html >
  );
}