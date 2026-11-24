import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AttachmentItem,
  KanbanColumn,
  Subtask,
  TaskFilterState,
  TaskItem,
  TaskLabel,
} from '../types/kanban';
import { INITIAL_COLUMNS, INITIAL_TASKS } from '../data/seedData';

interface BoardStore {
  boardName: string;
  columns: KanbanColumn[];
  tasks: TaskItem[];
  filters: TaskFilterState;

  setBoardName: (name: string) => void;
  addColumn: (title: string) => void;

  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'commentsCount'>) => TaskItem;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  addAttachment: (taskId: string, attachment: Omit<AttachmentItem, 'id'>) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;

  setFilter: <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) => void;
  resetFilters: () => void;
  resetBoardData: () => void;
}

const DEFAULT_FILTERS: TaskFilterState = {
  searchQuery: '',
  assigneeId: 'ALL',
  label: 'ALL',
  dueDateFilter: 'ALL',
};

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      boardName: 'Adhivasindo',
      columns: INITIAL_COLUMNS,
      tasks: INITIAL_TASKS,
      filters: DEFAULT_FILTERS,

      setBoardName: (boardName) => set({ boardName }),

      addColumn: (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const newCol: KanbanColumn = {
          id: `col-${Date.now()}`,
          title: trimmed,
        };
        set((state) => ({ columns: [...state.columns, newCol] }));
      },

      addTask: (taskInput) => {
        const created: TaskItem = {
          ...taskInput,
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          commentsCount: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ tasks: [created, ...state.tasks] }));
        return created;
      },

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        })),

      moveTask: (taskId, targetColumnId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, columnId: targetColumnId } : t
          ),
        })),

      addSubtask: (taskId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const newSub: Subtask = {
          id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: trimmed,
          completed: false,
        };
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSub] } : t
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            };
          }),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
            };
          }),
        })),

      addAttachment: (taskId, attachment) => {
        const item: AttachmentItem = {
          ...attachment,
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, attachments: [...t.attachments, item] } : t
          ),
        }));
      },

      removeAttachment: (taskId, attachmentId) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              attachments: t.attachments.filter((a) => a.id !== attachmentId),
            };
          }),
        })),

      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      resetBoardData: () =>
        set({
          boardName: 'Adhivasindo',
          columns: INITIAL_COLUMNS,
          tasks: INITIAL_TASKS,
          filters: DEFAULT_FILTERS,
        }),
    }),
    {
      name: 'adhivasindo-kanban-storage',
    }
  )
);

export const LABEL_OPTIONS: TaskLabel[] = ['Feature', 'Bug', 'Issue', 'Undefined'];