"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="glass-header flex justify-between items-center px-8 py-4 shadow-md border-b border-white/20">
      <div className="flex items-center space-x-8">
        <Link href="/" className="font-bold text-2xl text-white font-title hover:text-blue-200 transition-colors drop-shadow-md">
          MiniTrello
        </Link>
        {session && (
          <Link href="/boards" className="text-blue-200 hover:text-white font-semibold transition-colors drop-shadow-sm">
            My Boards
          </Link>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {session ? (
          <>
            <span className="text-white font-bold drop-shadow-sm">
              Hi, {session.user?.name || session.user?.email}
            </span>
            <button 
              onClick={() => signOut()} 
              className="px-4 py-2 text-red-200 hover:text-red-100 font-semibold transition-colors drop-shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            href="/login" 
            className="px-6 py-2 bg-blue-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors border border-white/20"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
