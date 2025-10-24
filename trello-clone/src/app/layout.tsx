import "./globals.css";
import AuthSessionProvider from "./components/SessionProvider";
import Navbar from "./components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-body">
        <AuthSessionProvider>
          <Navbar />
          <main className="p-6">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
