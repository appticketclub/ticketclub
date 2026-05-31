import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketClub",
  description: "Ticket reselling P&L tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        {children}
      </body>
    </html>
  );
}
