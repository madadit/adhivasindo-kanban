import React, { useEffect, useMemo, useState } from 'react';
import { IonDatetime, IonModal, IonPopover } from '@ionic/react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  Info,
  Paperclip,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { TEAM_MEMBERS } from '../data/seedData';
import { LABEL_OPTIONS, useBoardStore } from '../store/useBoardStore';
import { AttachmentItem, Subtask, TaskItem, TaskLabel, TaskPriority } from '../types/kanban';
import { ToastItem, ToastVariant } from './KanbanBoard';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  defaultColumnId: string;
  onClose: () => void;
}

const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High'];

const DUMMY_COVER_PRESETS = [
  {
    label: 'Modern Workspace',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Architecture',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Studio Design',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
];

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

function guessAttachmentType(fileName: string): AttachmentItem['type'] {
  const lower = fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|webp|gif)$/.test(lower)) return 'image';
  if (/\.(xls|xlsx|csv)$/.test(lower)) return 'sheet';
  if (/\.(pdf|doc|docx|txt|md)$/.test(lower)) return 'doc';
  return 'other';
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  task,
  defaultColumnId,
  onClose,
}) => {
  const { columns, addTask, updateTask, deleteTask } = useBoardStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [label, setLabel] = useState<TaskLabel>('Feature');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [coverImage, setCoverImage] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [completed, setCompleted] = useState(false);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [isDragOverFile, setIsDragOverFile] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const triggerToast = (message: string, variant: ToastVariant = 'success') => {
    setToast({ id: Date.now(), message, variant });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const formattedDueDate = useMemo(() => {
    if (!dueDate) return 'Pilih tanggal';
    const dateOnly = dueDate.slice(0, 10);
    const parsed = new Date(`${dateOnly}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateOnly;
    return parsed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [dueDate]);

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setColumnId(task.columnId);
      setAssigneeIds(task.assigneeIds);
      setDueDate(task.dueDate);
      setLabel(task.label);
      setPriority(task.priority ?? 'Medium');
      setCoverImage(task.coverImage ?? '');
      setSubtasks(task.subtasks);
      setAttachments(task.attachments);
      setCompleted(Boolean(task.completed));
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || 'col-todo');
      setAssigneeIds([TEAM_MEMBERS[0].id]);
      setDueDate(new Date().toISOString().slice(0, 10));
      setLabel('Feature');
      setPriority('Medium');
      setCoverImage('');
      setSubtasks([]);
      setAttachments([]);
      setCompleted(false);
    }

    setNewSubtaskTitle('');
    setNewAttachmentName('');
    setShowCoverPicker(false);
    setIsDragOverFile(false);
  }, [isOpen, task, defaultColumnId, columns]);

  const progress = useMemo(() => {
    const total = subtasks.length;
    const done = subtasks.filter((s) => s.completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [subtasks]);

  const toggleAssignee = (memberId: string) => {
    setAssigneeIds((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]));
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: trimmed,
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)));
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const registerDummyAttachment = (rawName: string, sizeBytes?: number) => {
    const cleaned = rawName.trim();
    if (!cleaned) return;
    const sizeLabel =
      typeof sizeBytes === 'number' && sizeBytes > 0 ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB` : 'Dummy File';

    setAttachments((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleaned,
        sizeLabel,
        type: guessAttachmentType(cleaned),
      },
    ]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => registerDummyAttachment(file.name, file.size));
    e.target.value = '';
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => registerDummyAttachment(file.name, file.size));
      return;
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text) registerDummyAttachment(text);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      triggerToast('Judul task wajib diisi', 'warning');
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      columnId,
      assigneeIds,
      dueDate,
      label,
      priority,
      coverImage: coverImage.trim() || undefined,
      subtasks,
      attachments,
      completed,
    };

    if (task) {
      updateTask(task.id, payload);
      triggerToast('Task berhasil diperbarui', 'success');
    } else {
      addTask(payload);
      triggerToast('Task baru berhasil ditambahkan', 'success');
    }
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    triggerToast('Task berhasil dihapus', 'error');
    onClose();
  };

  const activeToastStyle = toast ? (TOAST_STYLES[toast.variant] ?? TOAST_STYLES.info) : null;

  return (
    <>
      {toast && activeToastStyle && (
        <div
          role="status"
          aria-live="polite"
          style={{ top: '16px', right: '16px', zIndex: 30000 }}
          className={`fixed flex max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-lg transition-all ${activeToastStyle.box}`}
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

      <IonModal
        isOpen={isOpen}
        onDidDismiss={onClose}
        className="task-detail-modal"
        style={
          {
            '--width': '700px',
            '--max-width': '200vw',
            '--height': '88vh',
            '--max-height': '88vh',
            '--border-radius': '16px',
          } as React.CSSProperties
        }
      >
        <div className="flex h-full w-full flex-col bg-white text-slate-800">
          {/* Top Modal Bar */}
          <div className="flex w-full items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <button
              type="button"
              onClick={() => setCompleted((prev) => !prev)}
              style={{ minHeight: '36px', padding: '8px 14px' }}
              className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition ${
                completed
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{completed ? 'Completed' : 'Mark Complete'}</span>
            </button>

            <div className="flex items-center gap-2">
              {task && (
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Hapus task"
                  style={{ minHeight: '36px', padding: '8px 12px' }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="w-full flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="flex w-full flex-col gap-5">
              {/* 1. Cover Image */}
              <div className="w-full">
                {coverImage ? (
                  <div className="group relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img src={coverImage} alt="Task cover" className="h-full w-full object-cover" />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCoverPicker((prev) => !prev)}
                        style={{ minHeight: '32px', padding: '6px 12px' }}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900/80 text-xs font-medium text-white backdrop-blur transition hover:bg-slate-900"
                      >
                        Ganti Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        style={{ minHeight: '32px', padding: '6px 12px' }}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-rose-600/90 text-xs font-medium text-white transition hover:bg-rose-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCoverPicker((prev) => !prev)}
                    style={{ minHeight: '180px', padding: '16px' }}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
                  >
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                    <span>Add Cover Image</span>
                  </button>
                )}

                {showCoverPicker && (
                  <div className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {DUMMY_COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setCoverImage(preset.url);
                            setShowCoverPicker(false);
                          }}
                          style={{ minHeight: '32px', padding: '6px 12px' }}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="url"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="Atau tempel URL gambar..."
                      style={{ minHeight: '36px', padding: '6px 12px' }}
                      className="w-full rounded-lg border border-slate-200 bg-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* 2. Title */}
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul task..."
                  style={{ minHeight: '42px', padding: '8px 12px' }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-base font-bold text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Assignee (Avatar Only) */}
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Assignee</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {TEAM_MEMBERS.map((member) => {
                      const active = assigneeIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleAssignee(member.id)}
                          title={`${member.name} - ${member.role}`}
                          style={{
                            backgroundColor: member.avatarColor,
                            width: '34px',
                            height: '34px',
                            minWidth: '34px',
                            minHeight: '34px',
                            padding: 0,
                            borderRadius: '9999px',
                          }}
                          className={`inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition ${
                            active ? 'scale-105 ring-2 ring-blue-500 ring-offset-1' : 'opacity-45 hover:opacity-85'
                          }`}
                        >
                          {member.initials}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Due Date</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      id="due-date-trigger"
                      type="button"
                      onClick={() => setIsDatePickerOpen(true)}
                      title="Pilih tanggal"
                      style={{ minHeight: '38px', padding: '8px 12px' }}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 text-left text-sm text-slate-700 transition hover:border-blue-400 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                      <span className={dueDate ? 'font-medium text-slate-800' : 'text-slate-400'}>
                        {formattedDueDate}
                      </span>
                      <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
                    </button>
                  </div>

                  <IonPopover
                    isOpen={isDatePickerOpen}
                    trigger="due-date-trigger"
                    onDidDismiss={() => setIsDatePickerOpen(false)}
                  >
                    <IonDatetime
                      presentation="date"
                      value={dueDate || undefined}
                      onIonChange={(e) => {
                        const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                        if (val) {
                          setDueDate(val.slice(0, 10));
                        }
                        setIsDatePickerOpen(false);
                      }}
                    />
                  </IonPopover>
                </div>

                {/* Column */}
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Column</label>
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    style={{ minHeight: '38px', padding: '8px 12px' }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Label */}
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Label</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value as TaskLabel)}
                    style={{ minHeight: '38px', padding: '8px 12px' }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {LABEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="w-full">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Priority (Opsional)</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ minHeight: '38px', padding: '8px 12px' }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 8. Description */}
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan detail pekerjaan, catatan teknis, atau kriteria selesai..."
                  style={{ padding: '10px 12px' }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* 9. Attachments */}
              <div className="w-full border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Attachments</h3>
                  <span className="text-xs text-slate-400">{attachments.length} file</span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOverFile(true);
                  }}
                  onDragLeave={() => setIsDragOverFile(false)}
                  onDrop={handleFileDrop}
                  className={`w-full rounded-xl border border-dashed p-4 text-center transition ${
                    isDragOverFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <Paperclip className="mx-auto mb-1.5 h-4 w-4 text-slate-400" />
                  <p className="text-xs text-slate-600">
                    Drag &amp; Drop files here or{' '}
                    <label className="cursor-pointer font-semibold text-blue-600 underline">
                      browse from device
                      <input type="file" multiple onChange={handleFileInputChange} className="hidden" />
                    </label>
                  </p>

                  <div className="mt-3 flex w-full items-center gap-2">
                    <input
                      type="text"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          registerDummyAttachment(newAttachmentName);
                          setNewAttachmentName('');
                        }
                      }}
                      placeholder="Nama file dummy (mis. spec.pdf)"
                      style={{ minHeight: '36px', padding: '6px 12px' }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        registerDummyAttachment(newAttachmentName);
                        setNewAttachmentName('');
                      }}
                      style={{ minHeight: '36px', padding: '6px 16px' }}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-white transition hover:bg-slate-900"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <ul className="mt-3 w-full space-y-2">
                    {attachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                          <span className="truncate font-medium text-slate-700">{att.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-400">({att.sizeLabel})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== att.id))}
                          aria-label="Remove attachment"
                          style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
                          className="ml-2 inline-flex shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 10. Check List (Subtasks + Progress Bar) */}
              <div className="w-full border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    <span>Check List</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-600">
                    {progress.done}/{progress.total} ({progress.percent}%)
                  </span>
                </div>

                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                <div className="mb-3 flex w-full items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Tambah subtask baru..."
                    style={{ minHeight: '36px', padding: '6px 12px' }}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    style={{ minHeight: '36px', padding: '6px 14px' }}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Add subtask</span>
                  </button>
                </div>

                <ul className="w-full space-y-2">
                  {subtasks.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => handleToggleSubtask(sub.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`truncate text-xs ${
                            sub.completed ? 'text-slate-400 line-through' : 'font-medium text-slate-700'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(sub.id)}
                        aria-label="Remove subtask"
                        style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
                        className="inline-flex shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}

                  {subtasks.length === 0 && (
                    <li className="w-full rounded-lg border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">
                      Belum ada subtask
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex w-full items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              style={{ minHeight: '38px', padding: '8px 18px' }}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ minHeight: '38px', padding: '8px 22px' }}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </IonModal>
    </>
  );
};
