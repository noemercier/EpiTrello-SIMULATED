"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import TaskModal from "../../components/TaskModal";

interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  order: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Board {
  id: string;
  title: string;
  owner: User;
  members: User[];
  columns: Column[];
}

export default function BoardDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && boardId) {
      fetchBoard();
    }
  }, [status, boardId, router]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data);
      } else if (response.status === 404) {
        setError("Board not found");
      } else {
        setError("Failed to load board");
      }
    } catch (error) {
      console.error("Error fetching board:", error);
      setError("An error occurred while loading the board");
    } finally {
      setLoading(false);
    }
  };

  const addColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      const response = await fetch("/api/columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newColumnTitle,
          boardId: boardId,
        }),
      });

      if (response.ok) {
        const newColumn = await response.json();
        setBoard(prev => prev ? {
          ...prev,
          columns: [...prev.columns, newColumn].sort((a, b) => a.order - b.order)
        } : null);
        setNewColumnTitle("");
        setShowAddColumn(false);
      }
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setSelectedColumnId(null);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (selectedTask) {
        // Update existing task
        const response = await fetch(`/api/tasks/${selectedTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          const updatedTask = await response.json();
          setBoard(prev => {
            if (!prev) return null;
            return {
              ...prev,
              columns: prev.columns.map(column => ({
                ...column,
                tasks: column.tasks.map(task =>
                  task.id === selectedTask.id ? updatedTask : task
                )
              }))
            };
          });
        }
      } else {
        // Create new task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...taskData,
            columnId: selectedColumnId,
          }),
        });

        if (response.ok) {
          const newTask = await response.json();
          setBoard(prev => {
            if (!prev) return null;
            return {
              ...prev,
              columns: prev.columns.map(column =>
                column.id === selectedColumnId
                  ? { ...column, tasks: [...column.tasks, newTask] }
                  : column
              )
            };
          });
        }
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const getAllBoardMembers = (): User[] => {
    if (!board) return [];
    return [board.owner, ...board.members];
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => router.push("/boards")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Back to Boards
        </button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Board not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-full page-transition">
      {/* Board Header */}
      <div className="mb-8 glass-header p-6 rounded-xl shadow-sm animate-slide-in-left">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-title mb-2 tracking-tight">{board.title}</h1>
            <p className="text-white font-medium text-base drop-shadow-sm">
              Owner: <span className="text-white font-bold">{board.owner.name || board.owner.email}</span>
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-white bg-white/40 backdrop-blur-sm px-3 py-2 rounded-lg font-bold border border-white/30 drop-shadow-sm">
              {board.members.length} member{board.members.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {board.columns.map((column, index) => (
          <div key={column.id} className="flex-shrink-0 w-72 glass-effect rounded-lg p-4 animate-slide-in-right" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-white font-title tracking-wide drop-shadow-md">{column.title}</h3>
              <span className="text-xs text-slate-800 font-bold bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/40">
                {column.tasks.length} task{column.tasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {column.tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="glass-task p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:backdrop-blur-md"
                  onClick={() => handleEditTask(task)}
                >
                  <h4 className="font-semibold text-base text-slate-900 font-body mb-2 leading-tight">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-slate-800 mt-2 font-light leading-relaxed line-clamp-3">{task.description}</p>
                  )}
                  <div className="flex flex-col gap-1 mt-3">
                    {task.dueDate && (
                      <p className="text-xs text-orange-700 font-medium bg-orange-100/70 backdrop-blur-sm px-2 py-1 rounded inline-flex items-center w-fit">
                        📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {task.assignee && (
                      <p className="text-xs text-blue-900 font-bold bg-blue-100/70 backdrop-blur-sm px-2 py-1 rounded inline-flex items-center w-fit">
                        {task.assignee.name || task.assignee.email}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Task Button */}
              <button 
                onClick={() => handleAddTask(column.id)}
                className="w-full py-3 text-white font-bold border-2 border-dashed border-white/60 rounded-lg hover:border-blue-300 hover:text-blue-100 hover:bg-blue-400/30 backdrop-blur-sm transition-all duration-200 drop-shadow-sm btn-glass"
              >
                ✚ Add a task
              </button>
            </div>
          </div>
        ))}

        {/* Add Column Form */}
        {showAddColumn && (
          <div className="flex-shrink-0 w-72 glass-effect rounded-lg p-4 animate-fade-in-up">
            <form onSubmit={addColumn}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Enter column title..."
                className="w-full px-3 py-2 bg-white/40 backdrop-blur-sm border border-white/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 text-slate-900 font-medium placeholder-slate-600"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded text-sm hover:bg-green-600 border border-white/20 btn-glass"
                >
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddColumn(false);
                    setNewColumnTitle("");
                  }}
                  className="bg-gray-500/80 backdrop-blur-sm text-white px-3 py-1 rounded text-sm hover:bg-gray-600 border border-white/20 btn-glass"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Column Button (when not showing form) */}
        {!showAddColumn && (
          <div className="flex-shrink-0 w-72">
            <button
              onClick={() => setShowAddColumn(true)}
              className="w-full h-20 border-2 border-dashed border-white/60 rounded-lg text-white font-bold hover:border-blue-300 hover:text-blue-100 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 drop-shadow-sm"
            >
              + Add another column
            </button>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setSelectedTask(null);
          setSelectedColumnId(null);
        }}
        onSave={handleSaveTask}
        task={selectedTask}
        columnId={selectedColumnId || ""}
        boardMembers={getAllBoardMembers()}
      />
    </div>
  );
}
