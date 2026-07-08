"use client";
import HandleAuth from "@/components/HandleAuth";
// Home page
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <HandleAuth />
      <h1 className="text-4xl font-bold text-chrome">TicketClub</h1>
    </main>
  );
}
