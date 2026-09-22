'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  addReminder,
  updateReminder,
  deleteReminder,
  toggleReminderCaregiver,
  ReminderActionResult,
} from '@/app/actions/reminders';
import { ReminderType } from '@/types/database.types';

interface ReminderItem {
  id: string;
  patient_id: string;
  type: ReminderType;
  title: string;
  scheduled_time: string;
  recurrence_rule: string | null;
  is_done: boolean;
  created_at: string;
}

function SubmitButton({ isEditing }: { isEditing?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded transition"
    >
      {pending ? 'Saving...' : isEditing ? 'Update Reminder' : 'Add Reminder'}
    </button>
  );
}

export default function RemindersManager({
  patientId,
  patientName,
  reminders,
}: {
  patientId: string;
  patientName: string;
  reminders: ReminderItem[];
}) {
  const [editingItem, setEditingItem] = useState<ReminderItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [togglePendingId, setTogglePendingId] = useState<string | null>(null);
  const [reminderType, setReminderType] = useState<ReminderType>('recurring');

  const [addState, addAction] = useFormState<ReminderActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await addReminder(prev, formData);
      if (res.success) {
        setIsAdding(false);
      }
      return res;
    },
    null
  );

  const [editState, editAction] = useFormState<ReminderActionResult | null, FormData>(
    async (prev, formData) => {
      const res = await updateReminder(prev, formData);
      if (res.success) {
        setEditingItem(null);
      }
      return res;
    },
    null
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    setDeletePendingId(id);
    await deleteReminder(id, patientId);
    setDeletePendingId(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglePendingId(id);
    await toggleReminderCaregiver(id, patientId, !currentStatus);
    setTogglePendingId(null);
  };

  // Formats UTC date string to format needed by datetime-local input
  const formatForDateTimeLocal = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  // Format display time
  const formatDisplayTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Reminders — {patientName}
          </h2>
          <p className="text-xs text-gray-500">
            Manage daily medication, hydration, meal routines, and one-time appointments.
          </p>
        </div>

        {!isAdding && !editingItem && (
          <button
            onClick={() => {
              setIsAdding(true);
              setReminderType('recurring');
            }}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition self-start"
          >
            + Add Reminder
          </button>
        )}
      </div>

      {/* Add Reminder Form */}
      {isAdding && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800">New Reminder</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {addState?.error && (
            <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {addState.error}
            </div>
          )}

          <form action={addAction} className="space-y-3">
            <input type="hidden" name="patient_id" value={patientId} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reminder Type
                </label>
                <select
                  name="type"
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value as ReminderType)}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="recurring">Recurring (Daily Routine / Meds)</option>
                  <option value="one_time">One-Time (Appointment / Event)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title / Task
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Take Blood Pressure Medication"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  name="scheduled_time"
                  type="datetime-local"
                  required
                  defaultValue={formatForDateTimeLocal(new Date().toISOString())}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {reminderType === 'recurring' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Recurrence Pattern
                  </label>
                  <input
                    name="recurrence_rule"
                    type="text"
                    defaultValue="daily"
                    placeholder="e.g. daily, every morning, weekdays"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded font-medium"
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
        </div>
      )}

      {/* Edit Reminder Form */}
      {editingItem && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-amber-900">
              Edit Reminder: {editingItem.title}
            </h3>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {editState?.error && (
            <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
              {editState.error}
            </div>
          )}

          <form action={editAction} className="space-y-3">
            <input type="hidden" name="id" value={editingItem.id} />
            <input type="hidden" name="patient_id" value={patientId} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reminder Type
                </label>
                <select
                  name="type"
                  defaultValue={editingItem.type}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="recurring">Recurring</option>
                  <option value="one_time">One-Time</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title / Task
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={editingItem.title}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  name="scheduled_time"
                  type="datetime-local"
                  required
                  defaultValue={formatForDateTimeLocal(editingItem.scheduled_time)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recurrence Rule
                </label>
                <input
                  name="recurrence_rule"
                  type="text"
                  defaultValue={editingItem.recurrence_rule || 'daily'}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_done"
                name="is_done"
                value="true"
                defaultChecked={editingItem.is_done}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300"
              />
              <label htmlFor="edit_is_done" className="text-xs text-gray-700 font-medium">
                Mark as Completed
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded font-medium"
              >
                Cancel
              </button>
              <SubmitButton isEditing />
            </div>
          </form>
        </div>
      )}

      {/* Reminders Table */}
      {reminders.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          No reminders scheduled for {patientName}. Click &quot;+ Add Reminder&quot; to create one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Status</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3 w-28">Type</th>
                <th className="py-2.5 px-3 w-40">Schedule</th>
                <th className="py-2.5 px-3 text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reminders.map((reminder) => (
                <tr
                  key={reminder.id}
                  className={`hover:bg-gray-50/80 ${
                    reminder.is_done ? 'bg-gray-50/50 opacity-75' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggle(reminder.id, reminder.is_done)}
                      disabled={togglePendingId === reminder.id}
                      title={reminder.is_done ? 'Mark Undone' : 'Mark Done'}
                      className={`w-6 h-6 rounded flex items-center justify-center border font-bold text-xs transition ${
                        reminder.is_done
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'border-gray-300 text-transparent hover:border-emerald-500'
                      }`}
                    >
                      ✓
                    </button>
                  </td>

                  <td className="py-3 px-3 font-semibold text-gray-900">
                    <span className={reminder.is_done ? 'line-through text-gray-400' : ''}>
                      {reminder.title}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border uppercase ${
                        reminder.type === 'recurring'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {reminder.type === 'recurring' ? 'Recurring' : 'One-Time'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                    <div className="font-medium text-gray-800">
                      ⏰ {formatDisplayTime(reminder.scheduled_time)}
                    </div>
                    {reminder.type === 'recurring' ? (
                      <div className="text-gray-500 capitalize">
                        🔄 {reminder.recurrence_rule || 'Daily'}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        📅 {formatDisplayDate(reminder.scheduled_time)}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => setEditingItem(reminder)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      disabled={deletePendingId === reminder.id}
                      className="text-xs font-medium text-red-600 hover:text-red-800 underline disabled:opacity-50"
                    >
                      {deletePendingId === reminder.id ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
