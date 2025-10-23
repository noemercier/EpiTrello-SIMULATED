"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login?message=Registration successful");
      } else {
        setError(data.error || "An error occurred");
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
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-title">Create Account</h1>
        
        {error && (
          <div className="bg-red-500/80 backdrop-blur-sm border border-red-400/70 text-white px-4 py-3 rounded-lg mb-6 font-semibold drop-shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2 drop-shadow-sm">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder-slate-600 font-medium"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2 drop-shadow-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder-slate-600 font-medium"
              placeholder="Create a password"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-white text-sm font-bold mb-2 drop-shadow-sm">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder-slate-600 font-medium"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-bold text-lg transition-colors border border-white/20 btn-glass"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-white drop-shadow-sm font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-200 hover:text-white font-bold underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
