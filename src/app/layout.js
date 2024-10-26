import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Momentam HQ",
  description: "Momentam administration system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="main-content">{children}</div>
          <div className="small-screen-notice hidden fixed inset-0 flex items-center justify-center bg-white dark:bg-neutral-800">
            <div className="notice-content text-center p-8 max-w-md">
              <div className="text-4xl font-bold text-gray-800 dark:text-white mb-6 animate-fade-in">Momentam</div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 animate-slide-up">
                For the best experience, please access Momentam on a larger screen.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-slide-up delay-200">
                We're optimizing for mobile devices. Thank you for your patience.
              </p>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
