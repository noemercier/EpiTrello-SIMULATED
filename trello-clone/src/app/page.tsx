"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/boards");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 font-title">
          Welcome to <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MiniTrello</span> 🚀
        </h1>
        <p className="text-xl text-slate-600 mb-12 font-body">
          Create boards and manage tasks easily with our intuitive Kanban-style interface.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Create Account
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-semibold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 font-title">📋 Organize</h3>
            <p className="text-slate-600">Create boards and columns to organize your projects and tasks efficiently.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-semibold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 font-title">🎯 Track</h3>
            <p className="text-slate-600">Assign tasks, set due dates, and track progress with our intuitive interface.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-semibold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 font-title">🤝 Collaborate</h3>
            <p className="text-slate-600">Share boards with team members and collaborate on projects in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
