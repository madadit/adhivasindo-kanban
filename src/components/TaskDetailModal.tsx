import React, { useEffect, useMemo, useState } from 'react';
import { IonModal } from '@ionic/react';
import {
  Check,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { TEAM_MEMBERS } from '../data/seedData';
import { LABEL_OPTIONS, useBoardStore } from '../store/useBoardStore';
import {
  AttachmentItem,
  Subtask,
  TaskItem,
  TaskLabel,
  TaskPriority,
} from '../types/kanban';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  defaultColumnId: string;
  onClose: () => void;
  onShowToast: (message: string) => void;
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
  onShowToast,
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
    setAssigneeIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
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
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
  };

  const registerDummyAttachment = (rawName: string, sizeBytes?: number) => {
    const cleaned = rawName.trim();
    if (!cleaned) return;
    const sizeLabel =
      typeof sizeBytes === 'number' && sizeBytes > 0
        ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
        : 'Dummy File';

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
      Array.from(files).forEach((file) =>
        registerDummyAttachment(file.name, file.size)
      );
      return;
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text) registerDummyAttachment(text);
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      onShowToast('Judul task wajib diisi');
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
      onShowToast('Task berhasil diperbarui');
    } else {
      addTask(payload);
      onShowToast('Task baru berhasil ditambahkan');
    }
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    onShowToast('Task berhasil dihapus');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="task-detail-modal">
      <div className="flex h-full flex-col bg-white text-slate-800">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <button
            type="button"
            onClick={() => setCompleted((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              completed
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {completed ? 'Completed' : 'Mark Complete'}
          </button>

          <div className="flex items-center gap-2">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                title="Hapus task"
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-5 md:grid-cols-12 md:p-6">
          {/* Left Column: Cover, Title, Metadata, Description */}
          <div className="space-y-5 md:col-span-7">
            {/* Cover Image */}
            <div>
              {coverImage ? (
                <div className="group relative h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src={coverImage}
                    alt="Task cover"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute right-2.5 bottom-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCoverPicker((prev) => !prev)}
                      className="rounded-lg bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur hover:bg-slate-900"
                    >
                      Ganti Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="rounded-lg bg-rose-600/85 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCoverPicker((prev) => !prev)}
                  className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600"
                >
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                  Add Cover Image
                </button>
              )}

              {showCoverPicker && (
                <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {DUMMY_COVER_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => {
                          setCoverImage(preset.url);
                          setShowCoverPicker(false);
                        }}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul task..."
                className="w-full rounded-lg border border-transparent px-1 py-1 text-lg font-bold text-slate-900 transition hover:border-slate-200 focus:border-blue-500 focus:bg-slate-50/60 focus:px-2.5 focus:outline-none"
              />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Assignee
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TEAM_MEMBERS.map((member) => {
                    const active = assigneeIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleAssignee(member.id)}
                        title={`${member.name} - ${member.role}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white transition ${
                          active
                            ? 'scale-105 ring-2 ring-blue-500 ring-offset-1'
                            : 'opacity-45 hover:opacity-80'
                        }`}
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Column
                </label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Label
                </label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value as TaskLabel)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {LABEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Priority (Opsional)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan detail pekerjaan, catatan teknis, atau kriteria selesai..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Right Column: Attachments & Check List */}
          <div className="space-y-6 border-t border-slate-100 pt-5 md:col-span-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            {/* Attachments (Dummy) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Attachments</h3>
                <span className="text-xs text-slate-400">
                  {attachments.length} file
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverFile(true);
                }}
                onDragLeave={() => setIsDragOverFile(false)}
                onDrop={handleFileDrop}
                className={`rounded-xl border border-dashed p-3.5 text-center transition ${
                  isDragOverFile
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <Paperclip className="mx-auto mb-1 h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-600">
                  Drag &amp; Drop files here or{' '}
                  <label className="cursor-pointer font-semibold text-blue-600 underline">
                    browse from device
                    <input
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                </p>

                <div className="mt-2.5 flex gap-1.5">
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
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      registerDummyAttachment(newAttachmentName);
                      setNewAttachmentName('');
                    }}
                    className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>
              </div>

              {attachments.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                        <span className="truncate font-medium text-slate-700">
                          {att.name}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          ({att.sizeLabel})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((item) => item.id !== att.id)
                          )
                        }
                        className="ml-2 text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Check List (Subtasks + Progress Bar) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  Check List
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

              <div className="mb-3 flex gap-2">
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
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-600 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add subtask
                </button>
              </div>

              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
                {subtasks.map((sub) => (
                  <li
                    key={sub.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-1.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className={`truncate text-xs ${
                          sub.completed
                            ? 'text-slate-400 line-through'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}

                {subtasks.length === 0 && (
                  <li className="py-2 text-center text-xs text-slate-400">
                    Belum ada subtask
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </IonModal>
  );
};