import React, { useMemo, useState } from 'react';
import {
  Filter,
  MoreVertical,
  Pin,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useBoardStore, LABEL_OPTIONS } from '../store/useBoardStore';
import { TEAM_MEMBERS } from '../data/seedData';
import { TaskFilterState, TaskItem, TaskLabel } from '../types/kanban';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  onOpenNewTask: (columnId: string) => void;
  onSelectTask: (task: TaskItem) => void;
  onShowToast: (message: string) => void;
}

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

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onOpenNewTask,
  onSelectTask,
  onShowToast,
}) => {
  const {
    boardName,
    columns,
    tasks,
    filters,
    addColumn,
    moveTask,
    setFilter,
    resetFilters,
    resetBoardData,
  } = useBoardStore();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesTaskFilter(task, filters)),
    [tasks, filters]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.assigneeId !== 'ALL') count++;
    if (filters.label !== 'ALL') count++;
    if (filters.dueDateFilter !== 'ALL') count++;
    return count;
  }, [filters]);

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    addColumn(newColumnTitle);
    setNewColumnTitle('');
    setIsAddingList(false);
    onShowToast('Kolom baru berhasil ditambahkan');
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
    onShowToast(`Task dipindahkan ke "${targetCol?.title ?? 'Kolom'}"`);
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] text-slate-800">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {boardName}
            </h1>

            <div className="hidden items-center -space-x-1.5 sm:flex">
              {TEAM_MEMBERS.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setFilter(
                      'assigneeId',
                      filters.assigneeId === member.id ? 'ALL' : member.id
                    )
                  }
                  title={`Filter by ${member.name}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold text-white transition ${
                    filters.assigneeId === member.id
                      ? 'scale-110 border-blue-600 ring-2 ring-blue-300'
                      : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.initials}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-initial">
            <div className="relative w-full max-w-[210px] sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilter('searchQuery', e.target.value)}
                placeholder="Search Tasks"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-7 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => setFilter('searchQuery', '')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilterPanel((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                showFilterPanel || activeFilterCount > 0
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.2 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                resetBoardData();
                onShowToast('Data board dikembalikan ke data awal');
              }}
              title="Reset seed data"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilterPanel && (
          <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Assignee
                </label>
                <select
                  value={filters.assigneeId}
                  onChange={(e) => setFilter('assigneeId', e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
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
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Label
                </label>
                <select
                  value={filters.label}
                  onChange={(e) =>
                    setFilter('label', e.target.value as TaskLabel | 'ALL')
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
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
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Due Date
                </label>
                <select
                  value={filters.dueDateFilter}
                  onChange={(e) =>
                    setFilter(
                      'dueDateFilter',
                      e.target.value as TaskFilterState['dueDateFilter']
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">Semua Tanggal</option>
                  <option value="OVERDUE">Terlewat (Overdue)</option>
                  <option value="UPCOMING">Akan Datang</option>
                  <option value="NO_DATE">Tanpa Due Date</option>
                </select>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100/60"
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
          const columnTasks = filteredTasks.filter(
            (task) => task.columnId === column.id
          );
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
                isDropTarget
                  ? 'border-blue-400 bg-blue-50/70'
                  : 'border-slate-200/80 bg-[#eef2f7]'
              }`}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">
                    {column.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onOpenNewTask(column.id)}
                    title={`Tambah task ke ${column.title}`}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-2xs transition hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    type="button"
                    aria-label="Column menu"
                    className="rounded p-1 hover:bg-slate-200/60 hover:text-slate-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Pin column"
                    className="rounded p-1 hover:bg-slate-200/60 hover:text-slate-600"
                  >
                    <Pin className="h-3.5 w-3.5" />
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
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3.5 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-white hover:text-blue-600"
            >
              <Plus className="h-4 w-4" />
              Add new List
            </button>
          ) : (
            <form
              onSubmit={handleCreateColumn}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
            >
              <input
                type="text"
                autoFocus
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Nama kolom (mis. QA Testing)"
                className="mb-2.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingList(false);
                    setNewColumnTitle('');
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
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