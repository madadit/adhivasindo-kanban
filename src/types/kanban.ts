export type TaskLabel = 'Feature' | 'Bug' | 'Issue' | 'Undefined';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  initials: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AttachmentItem {
  id: string;
  name: string;
  sizeLabel: string;
  type: 'image' | 'doc' | 'sheet' | 'other';
}

export interface TaskItem {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assigneeIds: string[];
  dueDate: string;
  label: TaskLabel;
  priority?: TaskPriority;
  subtasks: Subtask[];
  attachments: AttachmentItem[];
  coverImage?: string;
  commentsCount: number;
  completed?: boolean;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
}

export interface TaskFilterState {
  searchQuery: string;
  assigneeId: string;
  label: TaskLabel | 'ALL';
  dueDateFilter: 'ALL' | 'OVERDUE' | 'UPCOMING' | 'NO_DATE';
}