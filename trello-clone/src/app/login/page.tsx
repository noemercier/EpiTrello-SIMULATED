"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        // Check if session was created
        const session = await getSession();
        if (session) {
          router.push("/boards");
        }
      }
    } catch (error) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 page-transition">
      <div className="glass-modal p-8 rounded-xl shadow-lg w-full max-w-md bg-white/25 backdrop-blur-lg border-2 border-white/50">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-title">Welcome Back</h1>
        
        {error && (
          <div className="bg-red-500/80 backdrop-blur-sm border border-red-400/70 text-white px-4 py-3 rounded-lg mb-6 font-semibold drop-shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white text-sm font-bold mb-2 drop-shadow-sm">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder-slate-600 font-medium"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-white text-sm font-bold mb-2 drop-shadow-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder-slate-600 font-medium"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-lg transition-colors border border-white/20 btn-glass"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-white drop-shadow-sm font-medium">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-200 hover:text-white font-bold underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
