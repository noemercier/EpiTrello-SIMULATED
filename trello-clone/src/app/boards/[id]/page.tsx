"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskModal from "../../components/TaskModal";
import { MdDelete } from 'react-icons/md';

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
  columnId?: string;
}

// Droppable Column Component
interface DroppableColumnProps {
  column: Column;
  children: React.ReactNode;
}

function DroppableColumn({ column, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`transition-all duration-200 ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

// Draggable Task Component
interface DraggableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDeleting?: boolean;
}

function DraggableTask({ task, onEdit, onDelete, isDeleting }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform) + (isDeleting ? ' scale(0.95)' : ''),
    transition: isDeleting ? 'opacity 0.2s ease-out, transform 0.2s ease-out' : transition,
    opacity: isDragging ? 0.5 : isDeleting ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-task p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:backdrop-blur-md group relative"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1" onClick={() => onEdit(task)}>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-all duration-200 transform hover:scale-110"
          title="Delete task"
        >
          <MdDelete size={16} />
        </button>
      </div>
    </div>
  );
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
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDeleteTask = async (taskId: string) => {
    // Set deleting state for animation
    setDeletingTaskId(taskId);
    
    // Small delay for animation before removing from state
    setTimeout(() => {
      setBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.map(column => ({
            ...column,
            tasks: column.tasks.filter(task => task.id !== taskId)
          }))
        };
      });
      setDeletingTaskId(null);
    }, 200);

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      // Revert the change if the API call fails
      setDeletingTaskId(null);
      fetchBoard();
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    // Set deleting state for animation
    setDeletingColumnId(columnId);
    
    // Small delay for animation before removing from state
    setTimeout(() => {
      setBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.filter(column => column.id !== columnId)
        };
      });
      setDeletingColumnId(null);
    }, 300);

    try {
      await fetch(`/api/columns/${columnId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting column:", error);
      // Revert the change if the API call fails
      setDeletingColumnId(null);
      fetchBoard();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task and its current column
    let activeTask: Task | null = null;
    let activeColumnId: string | null = null;

    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === activeId);
      if (task) {
        activeTask = task;
        activeColumnId = column.id;
        break;
      }
    }

    if (!activeTask || !activeColumnId) return;

    // Find the over item (could be a task or column)
    let overTask: Task | null = null;
    let overColumnId: string | null = null;

    // Check if overId is a column
    const overColumn = board.columns.find(col => col.id === overId);
    if (overColumn) {
      overColumnId = overId;
    } else {
      // Check if overId is a task
      for (const column of board.columns) {
        const task = column.tasks.find(t => t.id === overId);
        if (task) {
          overTask = task;
          overColumnId = column.id;
          break;
        }
      }
    }

    if (!overColumnId) return;

    // Don't do anything if dropping on the same position
    if (activeColumnId === overColumnId && (!overTask || activeTask.id === overTask.id)) {
      return;
    }

    setBoard(prev => {
      if (!prev) return null;

      const newColumns = [...prev.columns];

      // Find column indices
      const activeColIndex = newColumns.findIndex(col => col.id === activeColumnId);
      const overColIndex = newColumns.findIndex(col => col.id === overColumnId);

      if (activeColIndex === -1 || overColIndex === -1) return prev;

      // Remove task from active column
      const activeColumn = { ...newColumns[activeColIndex] };
      const activeTaskIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
      if (activeTaskIndex === -1) return prev;

      const [movedTask] = activeColumn.tasks.splice(activeTaskIndex, 1);
      newColumns[activeColIndex] = activeColumn;

      // Add task to target column
      const overColumn = { ...newColumns[overColIndex] };
      
      if (overTask) {
        // Insert at specific position
        const overTaskIndex = overColumn.tasks.findIndex(t => t.id === overTask.id);
        overColumn.tasks.splice(overTaskIndex, 0, movedTask);
      } else {
        // Add to end of column
        overColumn.tasks.push(movedTask);
      }
      
      newColumns[overColIndex] = overColumn;

      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !board) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active task and its current column after the move
    let activeTask: Task | null = null;
    let activeColumnId: string | null = null;

    for (const column of board.columns) {
      const task = column.tasks.find(t => t.id === activeId);
      if (task) {
        activeTask = task;
        activeColumnId = column.id;
        break;
      }
    }

    if (!activeTask || !activeColumnId) return;

    // If we're reordering within the same column
    if (activeId !== overId) {
      const column = board.columns.find(col => col.id === activeColumnId);
      if (column && column.tasks.some(t => t.id === overId)) {
        setBoard(prev => {
          if (!prev) return null;

          const newColumns = prev.columns.map(col => {
            if (col.id === activeColumnId) {
              const tasks = [...col.tasks];
              const oldIndex = tasks.findIndex(t => t.id === activeId);
              const newIndex = tasks.findIndex(t => t.id === overId);
              
              if (oldIndex !== -1 && newIndex !== -1) {
                return {
                  ...col,
                  tasks: arrayMove(tasks, oldIndex, newIndex)
                };
              }
            }
            return col;
          });

          return { ...prev, columns: newColumns };
        });
      }
    }

    // Update task positions in the database
    await updateTaskPositions();
  };

  const findTaskById = (id: string): (Task & { columnId: string }) | null => {
    if (!board) return null;
    
    for (const column of board.columns) {
      const task = column.tasks.find(task => task.id === id);
      if (task) {
        return { ...task, columnId: column.id };
      }
    }
    return null;
  };

  const updateTaskPositions = async () => {
    if (!board) return;

    const tasksToUpdate: { id: string; columnId: string; order: number }[] = [];

    board.columns.forEach(column => {
      column.tasks.forEach((task, index) => {
        tasksToUpdate.push({
          id: task.id,
          columnId: column.id,
          order: index
        });
      });
    });

    try {
      await fetch("/api/tasks/bulk-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: tasksToUpdate }),
      });
    } catch (error) {
      console.error("Error updating task positions:", error);
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
            <button
              onClick={() => setShowAddColumn(true)}
              className="px-6 py-3 bg-emerald-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm transition-all transform hover:scale-105 shadow-md border border-white/20 btn-glass"
            >
              + Add Column
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Columns */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {board.columns.map((column, index) => (
            <DroppableColumn key={column.id} column={column}>
              <div 
                className={`flex-shrink-0 w-72 glass-effect rounded-lg p-4 animate-slide-in-right transition-all duration-300 ${
                  deletingColumnId === column.id ? 'opacity-0 scale-95 transform' : ''
                }`} 
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl text-white font-title tracking-wide drop-shadow-md">{column.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-800 font-bold bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/40">
                      {column.tasks.length} task{column.tasks.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50/20 p-1.5 rounded-full transition-all duration-200 opacity-60 hover:opacity-100 transform hover:scale-110"
                      title="Delete column"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <SortableContext items={column.tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 min-h-[200px]">
                    {column.tasks.map((task) => (
                      <DraggableTask 
                        key={task.id} 
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        isDeleting={deletingTaskId === task.id}
                      />
                    ))}

                    {/* Add Task Button */}
                    <button 
                      onClick={() => handleAddTask(column.id)}
                      className="w-full py-3 text-white font-bold border-2 border-dashed border-white/60 rounded-lg hover:border-blue-300 hover:text-blue-100 hover:bg-blue-400/30 backdrop-blur-sm transition-all duration-200 drop-shadow-sm btn-glass"
                    >
                      ✚ Add a task
                    </button>
                  </div>
                </SortableContext>
              </div>
            </DroppableColumn>
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

        <DragOverlay>
          {activeId ? (
            <div className="glass-task p-4 rounded-lg shadow-lg cursor-grabbing opacity-90 transform rotate-2">
              {(() => {
                const activeTask = findTaskById(activeId);
                if (!activeTask) return null;
                return (
                  <>
                    <h4 className="font-semibold text-base text-slate-900 font-body mb-2 leading-tight">{activeTask.title}</h4>
                    {activeTask.description && (
                      <p className="text-sm text-slate-800 mt-2 font-light leading-relaxed line-clamp-3">{activeTask.description}</p>
                    )}
                  </>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
