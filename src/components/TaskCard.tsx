import React from 'react';
import { Calendar, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import { TaskItem, TaskLabel, TeamMember } from '../types/kanban';
import { TEAM_MEMBERS } from '../data/seedData';

interface TaskCardProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
  onDragStartTask: (taskId: string) => void;
}

const LABEL_STYLES: Record<TaskLabel, { badge: string; bar: string }> = {
  Feature: {
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    bar: 'bg-emerald-500',
  },
  Bug: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    bar: 'bg-rose-500',
  },
  Issue: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    bar: 'bg-sky-500',
  },
  Undefined: {
    badge: 'bg-slate-200 text-slate-700 border-slate-300',
    bar: 'bg-sky-500',
  },
};

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask, onDragStartTask }) => {
  const assignees: TeamMember[] = TEAM_MEMBERS.filter((m) => task.assigneeIds.includes(m.id));

  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const labelStyle = LABEL_STYLES[task.label] ?? LABEL_STYLES.Undefined;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStartTask(task.id);
      }}
      onClick={() => onSelectTask(task)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:cursor-grabbing"
    >
      {task.coverImage && (
        <div className="mb-3 h-32 w-full overflow-hidden rounded-lg bg-slate-100">
          <img
            src={task.coverImage}
            alt={task.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${labelStyle.badge}`}
        >
          {task.label}
        </span>
      </div>

      {totalSubtasks > 0 && (
        <div className="mb-3 mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${labelStyle.bar}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <h5 className="mb-2.5 text-sm leading-snug font-semibold text-slate-600">{task.title}</h5>

      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2.5">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">
              <Calendar className="h-3 w-3" />
              {formatShortDate(task.dueDate)}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
              <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.attachments.length > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] text-slate-500"
              title={task.attachments.map((a) => a.name).join(', ')}
            >
              <Paperclip className="h-3.5 w-3.5 text-slate-400" />
              {task.attachments.length}
            </span>
          )}
        </div>

        <div className="flex -space-x-1.5 overflow-hidden">
          {assignees.slice(0, 3).map((member) => (
            <div
              key={member.id}
              title={`${member.name} (${member.role})`}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.initials}
            </div>
          ))}
          {assignees.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-[10px] font-semibold text-white">
              +{assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
