import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "earthrader",
  description: "Earthrader is a EarthQuake Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
