"use client";

import { useState, useEffect } from "react";

interface Task {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task?: Task | null;
  columnId: string;
  boardMembers: User[];
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
  columnId,
  boardMembers
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
      setAssigneeId(task.assigneeId || "");
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssigneeId("");
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const taskData: Task = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined,
      };

      if (task?.id) {
        taskData.id = task.id;
      }

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="glass-modal rounded-lg p-6 w-full max-w-md mx-4 glass-glow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-title">
            {task ? "Edit Task" : "Create Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-slate-800 text-sm font-bold mb-3 font-title">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium text-base"
              placeholder="Enter a clear, descriptive task title..."
              required
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="block text-slate-800 text-sm font-bold mb-3 font-title">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-light leading-relaxed"
              placeholder="Add details, notes, or context for this task..."
              rows={4}
            />
          </div>

          <div className="mb-5">
            <label className="block text-slate-800 text-sm font-bold mb-3 font-title">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium"
            />
          </div>

          <div className="mb-8">
            <label className="block text-slate-800 text-sm font-bold mb-3 font-title">
              Assign To
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 font-medium"
            >
              <option value="" className="text-slate-500 bg-white">Choose a team member...</option>
              {boardMembers.map((member) => (
                <option key={member.id} value={member.id} className="text-slate-900 bg-white">
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-slate-700 hover:bg-white/50 font-semibold transition-colors btn-glass"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-3 bg-blue-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold transition-colors border border-white/20 btn-glass"
            >
              {saving ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
