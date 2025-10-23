"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-body">
        <SessionProvider>
          <Navbar />
          <main className="p-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
