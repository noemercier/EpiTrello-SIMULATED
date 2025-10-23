"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Board {
  id: string;
  title: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  _count: {
    columns: number;
  };
}

export default function BoardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchBoards();
    }
  }, [status, router]);

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newBoardTitle }),
      });

      if (response.ok) {
        const newBoard = await response.json();
        setBoards([newBoard, ...boards]);
        setNewBoardTitle("");
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error creating board:", error);
    } finally {
      setCreating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white font-semibold text-lg drop-shadow-md">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto page-transition">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 font-title bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Boards</h1>
          <p className="text-white mt-2 font-medium drop-shadow-sm">Organize your projects and collaborate with your team</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all transform hover:scale-105 shadow-lg btn-glass"
        >
          + Create Board
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 glass-effect p-6 rounded-xl shadow-lg animate-fade-in-up bg-white/25 backdrop-blur-lg border-2 border-white/50">
          <h3 className="text-lg font-semibold text-white mb-4 font-title drop-shadow-sm">✨ Create New Board</h3>
          <form onSubmit={createBoard}>
            <div className="flex gap-3">
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Enter board title..."
                className="flex-1 px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 font-medium placeholder-slate-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={creating || !newBoardTitle.trim()}
                className="px-6 py-3 bg-emerald-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold transition-colors border border-white/20 btn-glass"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewBoardTitle("");
                }}
                className="px-6 py-3 bg-slate-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-600 font-semibold transition-colors border border-white/20 btn-glass"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-6">📋</div>
          <h2 className="text-2xl font-semibold text-white mb-4 font-title drop-shadow-md">No boards yet</h2>
          <p className="text-gray-200 mb-8 drop-shadow-sm font-medium">Create your first board to start organizing your tasks</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg btn-glass"
          >
            Create Your First Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="block glass-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 card-hover bg-white/30 backdrop-blur-md border-2 border-white/50"
            >
              <h3 className="text-xl font-semibold mb-3 text-white font-title drop-shadow-md">{board.title}</h3>
              <div className="text-white mb-3 font-bold drop-shadow-sm">
                {board._count.columns} column{board._count.columns !== 1 ? "s" : ""}
              </div>
              <div className="text-sm text-white mb-2 font-bold drop-shadow-sm">
                Owner: {board.owner.name || board.owner.email}
              </div>
              {board.members.length > 0 && (
                <div className="text-sm text-white mb-3 font-semibold drop-shadow-sm">
                  {board.members.length} member{board.members.length !== 1 ? "s" : ""}
                </div>
              )}
              <div className="text-xs text-gray-200 pt-3 border-t border-white/30 font-medium drop-shadow-sm">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
