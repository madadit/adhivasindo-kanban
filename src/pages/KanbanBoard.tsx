import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useBoardStore, LABEL_OPTIONS } from '../store/useBoardStore';
import { TEAM_MEMBERS } from '../data/seedData';
import { TaskFilterState, TaskItem, TaskLabel } from '../types/kanban';
import { TaskCard } from '../components/TaskCard';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface KanbanBoardProps {
  onOpenNewTask: (columnId: string) => void;
  onSelectTask: (task: TaskItem) => void;
}

const TOAST_STYLES: Record<
  ToastVariant,
  {
    box: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />,
  },
  info: {
    box: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: <Info className="h-4 w-4 shrink-0 text-sky-600" />,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />,
  },
  error: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <XCircle className="h-4 w-4 shrink-0 text-rose-600" />,
  },
};

function matchesTaskFilter(task: TaskItem, filters: TaskFilterState): boolean {
  const query = filters.searchQuery.trim().toLowerCase();
  if (query) {
    const inTitle = task.title.toLowerCase().includes(query);
    const inDesc = task.description.toLowerCase().includes(query);
    const inLabel = task.label.toLowerCase().includes(query);
    if (!inTitle && !inDesc && !inLabel) return false;
  }

  if (filters.assigneeId !== 'ALL') {
    if (!task.assigneeIds.includes(filters.assigneeId)) return false;
  }

  if (filters.label !== 'ALL') {
    if (task.label !== filters.label) return false;
  }

  if (filters.dueDateFilter !== 'ALL') {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (filters.dueDateFilter === 'NO_DATE' && task.dueDate) return false;
    if (filters.dueDateFilter === 'OVERDUE') {
      if (!task.dueDate || task.dueDate >= todayStr) return false;
    }
    if (filters.dueDateFilter === 'UPCOMING') {
      if (!task.dueDate || task.dueDate < todayStr) return false;
    }
  }

  return true;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenNewTask, onSelectTask }) => {
  const { boardName, columns, tasks, filters, addColumn, moveTask, setFilter, resetFilters, resetBoardData } =
    useBoardStore();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [toast, setToast] = useState<ToastItem | null>(null);

  const triggerToast = (message: string, variant: ToastVariant = 'success') => {
    setToast({ id: Date.now(), message, variant });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredTasks = useMemo(() => tasks.filter((task) => matchesTaskFilter(task, filters)), [tasks, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.assigneeId !== 'ALL') count++;
    if (filters.label !== 'ALL') count++;
    if (filters.dueDateFilter !== 'ALL') count++;
    return count;
  }, [filters]);

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) {
      triggerToast('Nama kolom wajib diisi', 'warning');
      return;
    }
    addColumn(newColumnTitle);
    setNewColumnTitle('');
    setIsAddingList(false);
    triggerToast('Kolom baru berhasil ditambahkan', 'success');
  };

  const handleDropOnColumn = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumnId(null);
    setDraggedTaskId(null);

    if (!taskId) return;
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.columnId === targetColumnId) return;

    const targetCol = columns.find((c) => c.id === targetColumnId);
    moveTask(taskId, targetColumnId);
    triggerToast(`Task dipindahkan ke "${targetCol?.title ?? 'Kolom'}"`, 'info');
  };

  const activeToastStyle = toast ? (TOAST_STYLES[toast.variant] ?? TOAST_STYLES.info) : null;

  return (
    <div className="min-h-full bg-[#f5f7fb] font-sans text-slate-800 antialiased">
      {/* Top-Right Toast Notification */}
      {toast && activeToastStyle && (
        <div
          role="status"
          aria-live="polite"
          style={{ top: '16px', right: '16px', zIndex: 9999 }}
          className={`fixed flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium leading-snug tracking-normal shadow-lg transition-all ${activeToastStyle.box}`}
        >
          {activeToastStyle.icon}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup toast"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Workspace Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">{boardName}</h1>

            {/* Avatar Assignee Buttons */}
            <div className="hidden items-center gap-1 sm:flex">
              {TEAM_MEMBERS.map((member) => {
                const isSelected = filters.assigneeId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setFilter('assigneeId', isSelected ? 'ALL' : member.id)}
                    title={`Filter by ${member.name}`}
                    style={{
                      backgroundColor: member.avatarColor,
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      minHeight: '32px',
                      padding: 0,
                      borderRadius: '9999px',
                    }}
                    className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold leading-none tracking-wide text-white transition ${
                      isSelected ? 'scale-105 border-blue-600 ring-2 ring-blue-300' : 'border-white hover:scale-105'
                    }`}
                  >
                    {member.initials}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex w-full flex-1 items-center justify-end gap-2.5 sm:w-auto">
            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilterPanel((prev) => !prev)}
              style={{ minHeight: '38px', padding: '8px 14px' }}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-medium leading-none transition ${
                showFilterPanel || activeFilterCount > 0
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4 shrink-0" />
              <span>Filter</span>

              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold leading-none tabular-nums text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => {
                resetBoardData();
                triggerToast('Data board dikembalikan ke data awal', 'info');
              }}
              title="Reset seed data"
              style={{ minHeight: '38px', padding: '8px 12px' }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium leading-none text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Reset</span>
            </button>

            {/* Search Bar */}
            <div className="relative min-w-0 flex-1 sm:w-[250px] sm:flex-none lg:w-[300px]">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilter('searchQuery', e.target.value)}
                placeholder="Search tasks..."
                style={{ minHeight: '38px', paddingLeft: '36px', paddingRight: '32px' }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-normal leading-normal text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />

              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilter('searchQuery', '')}
                  aria-label="Clear search"
                  style={{ width: '24px', height: '24px' }}
                  className="absolute top-1/2 right-2 inline-flex -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilterPanel && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold leading-tight tracking-wide text-slate-600">
                  Assignee
                </label>
                <select
                  value={filters.assigneeId}
                  onChange={(e) => setFilter('assigneeId', e.target.value)}
                  style={{ minHeight: '36px', padding: '6px 12px' }}
                  className="rounded-lg border border-slate-200 bg-white text-sm font-normal leading-normal text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Anggota</option>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold leading-tight tracking-wide text-slate-600">
                  Label
                </label>
                <select
                  value={filters.label}
                  onChange={(e) => setFilter('label', e.target.value as TaskLabel | 'ALL')}
                  style={{ minHeight: '36px', padding: '6px 12px' }}
                  className="rounded-lg border border-slate-200 bg-white text-sm font-normal leading-normal text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Label</option>
                  {LABEL_OPTIONS.map((lbl) => (
                    <option key={lbl} value={lbl}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold leading-tight tracking-wide text-slate-600">
                  Due Date
                </label>
                <select
                  value={filters.dueDateFilter}
                  onChange={(e) => setFilter('dueDateFilter', e.target.value as TaskFilterState['dueDateFilter'])}
                  style={{ minHeight: '36px', padding: '6px 12px' }}
                  className="rounded-lg border border-slate-200 bg-white text-sm font-normal leading-normal text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Tanggal</option>
                  <option value="OVERDUE">Terlewat (Overdue)</option>
                  <option value="UPCOMING">Akan Datang</option>
                  <option value="NO_DATE">Tanpa Due Date</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  triggerToast('Filter dibersihkan', 'info');
                }}
                style={{ minHeight: '36px', padding: '8px 14px' }}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50/60 text-xs font-semibold leading-none text-blue-600 transition hover:bg-blue-100"
              >
                Bersihkan Filter
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Kanban Columns */}
      <main className="mx-auto flex max-w-[1600px] items-start gap-4 overflow-x-auto px-4 py-5 sm:px-6">
        {columns.map((column) => {
          const columnTasks = filteredTasks.filter((task) => task.columnId === column.id);
          const isDropTarget = dragOverColumnId === column.id;

          return (
            <section
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumnId !== column.id) {
                  setDragOverColumnId(column.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverColumnId === column.id) {
                  setDragOverColumnId(null);
                }
              }}
              onDrop={(e) => handleDropOnColumn(e, column.id)}
              className={`flex w-[300px] shrink-0 flex-col rounded-2xl border p-3 transition-colors sm:w-[320px] ${
                isDropTarget ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-[#eef2f7]'
              }`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold leading-snug tracking-tight text-slate-800">{column.title}</h2>
                  <button
                    type="button"
                    onClick={() => onOpenNewTask(column.id)}
                    title={`Tambah task ke ${column.title}`}
                    style={{ width: '26px', height: '26px', minWidth: '26px', minHeight: '26px', marginTop: '6px' }}
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="mt-2 text-xs font-medium leading-none tabular-nums text-slate-500">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    aria-label="Column menu"
                    style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
                    className="inline-flex shrink-0 items-center justify-center rounded-md hover:bg-slate-200/70 hover:text-slate-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tasks Stack */}
              <div className="flex min-h-[120px] flex-col gap-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelectTask={onSelectTask}
                    onDragStartTask={(id) => setDraggedTaskId(id)}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 text-center text-xs font-normal leading-relaxed text-slate-400">
                    Tidak ada task di kolom ini
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* + Add new List */}
        <div className="w-[300px] shrink-0 sm:w-[320px]">
          {!isAddingList ? (
            <button
              type="button"
              onClick={() => setIsAddingList(true)}
              style={{ minHeight: '46px', padding: '12px 16px' }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-medium leading-none text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add new List</span>
            </button>
          ) : (
            <form onSubmit={handleCreateColumn} className="rounded-2xl border border-slate-200 bg-white p-3">
              <input
                type="text"
                autoFocus
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Nama kolom (mis. QA Testing)"
                style={{ minHeight: '38px', padding: '8px 12px' }}
                className="mb-3 w-full rounded-lg border border-slate-200 text-sm font-normal leading-normal text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingList(false);
                    setNewColumnTitle('');
                  }}
                  style={{ minHeight: '34px', padding: '6px 12px' }}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium leading-none text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ minHeight: '34px', padding: '6px 14px' }}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold leading-none text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
