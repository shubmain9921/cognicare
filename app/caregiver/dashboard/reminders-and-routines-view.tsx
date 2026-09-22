'use client';

import { useState } from 'react';
import {
  addRoutineItem,
  updateRoutineItem,
  toggleRoutineItem,
  deleteRoutineItem,
} from '@/app/actions/routines';
import {
  addReminder,
  updateReminderStatus,
  deleteReminder,
} from '@/app/actions/reminders';
import type { DemoRoutine, DemoReminder } from '@/lib/demo-types';
import { ReminderStatus, ReminderType } from '@/types/database.types';

interface RemindersAndRoutinesViewProps {
  patientId: string;
  patientName: string;
  routines: DemoRoutine[];
  reminders: DemoReminder[];
}

export default function RemindersAndRoutinesView({
  patientId,
  patientName,
  routines,
  reminders,
}: RemindersAndRoutinesViewProps) {
  const [activeTab, setActiveTab] = useState<'routines' | 'reminders'>('routines');
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Adherence Calculation
  const totalReminders = reminders.length;
  const acknowledgedCount = reminders.filter((r) => r.status === 'acknowledged').length;
  const postponedCount = reminders.filter((r) => r.status === 'postponed').length;
  const missedCount = reminders.filter((r) => r.status === 'missed').length;
  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const adherenceRate = totalReminders > 0 ? Math.round((acknowledgedCount / totalReminders) * 100) : 100;

  const handleRoutineToggle = async (routineId: string, currentStatus: boolean) => {
    await toggleRoutineItem(routineId, !currentStatus);
    setStatusFeedback('Routine status updated.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleRoutineDelete = async (routineId: string) => {
    await deleteRoutineItem(routineId);
    setStatusFeedback('Routine deleted.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleReminderStatusChange = async (reminderId: string, newStatus: ReminderStatus) => {
    await updateReminderStatus(reminderId, patientId, newStatus);
    setStatusFeedback(`Reminder marked as ${newStatus}.`);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleReminderDelete = async (reminderId: string) => {
    await deleteReminder(reminderId, patientId);
    setStatusFeedback('Reminder removed.');
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Switcher */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('routines')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'routines'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>🗓️</span> Daily Routine ("My Day" Engine)
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reminders'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>🔔</span> Reminders & Adherence Tracker
          </button>
        </div>

        <span className="text-xs text-gray-500 font-medium px-3 hidden sm:inline">
          Scoped for: <strong>{patientName}</strong>
        </span>
      </div>

      {statusFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
          {statusFeedback}
        </div>
      )}

      {/* SECTION 1: DAILY ROUTINE ("MY DAY" ENGINE) */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Daily Routine Schedule for {patientName}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Defines the patient’s normal schedule. Powers both the patient's <strong>"My Day"</strong> dashboard and the <strong>"Daily Routine Recall"</strong> memory game.
                </p>
              </div>

              <button
                onClick={() => setIsAddRoutineOpen(!isAddRoutineOpen)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
              >
                {isAddRoutineOpen ? '✕ Close Form' : '+ Add Routine Item'}
              </button>
            </div>

            {/* Add Routine Form */}
            {isAddRoutineOpen && (
              <form
                action={async (formData) => {
                  await addRoutineItem(patientId, formData);
                  setIsAddRoutineOpen(false);
                  setStatusFeedback('Routine item added successfully.');
                }}
                className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-4 animate-in fade-in"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Add New Routine Checkpoint
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Time of Day *
                    </label>
                    <input
                      type="time"
                      name="time_of_day"
                      required
                      defaultValue="09:00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Routine Event Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g. Morning Medicine, Breakfast, Walk"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description / Supportive Notes
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. Warm glass of water, blood pressure pill"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">Days Active</label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                      <label key={day} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                        <input type="checkbox" name="days" value={day} defaultChecked className="rounded text-emerald-600" />
                        <span className="capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Routine Item
                </button>
              </form>
            )}

            {/* Timeline View */}
            <div className="relative border-l-2 border-emerald-200 ml-4 space-y-6 my-4">
              {routines.map((routine) => (
                <div key={routine.id} className="relative pl-6">
                  {/* Timeline Node */}
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-200" />

                  <div className="p-4 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {routine.time_of_day}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{routine.title}</h4>
                        {!routine.is_enabled && (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-xs text-gray-600 mt-1">{routine.description}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
                        Days: {routine.days_of_week.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingRoutineId(editingRoutineId === routine.id ? null : routine.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
                      >
                        {editingRoutineId === routine.id ? 'Cancel' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoutineToggle(routine.id, routine.is_enabled)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                          routine.is_enabled
                            ? 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {routine.is_enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoutineDelete(routine.id)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Inline Routine Edit Form */}
                  {editingRoutineId === routine.id && (
                    <form
                      action={async (formData) => {
                        const res = await updateRoutineItem(routine.id, formData);
                        if (res.success) {
                          setEditingRoutineId(null);
                          setStatusFeedback(res.message || 'Routine updated.');
                          setTimeout(() => setStatusFeedback(null), 3000);
                        }
                      }}
                      className="mt-2 p-4 bg-white border-2 border-emerald-300 rounded-xl space-y-3 shadow-xs animate-in fade-in"
                    >
                      <h5 className="text-xs font-bold text-gray-800">Edit Routine Checkpoint</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Time of Day</label>
                          <input
                            type="time"
                            name="time_of_day"
                            required
                            defaultValue={routine.time_of_day}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Title</label>
                          <input
                            type="text"
                            name="title"
                            required
                            defaultValue={routine.title}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">Description</label>
                        <input
                          type="text"
                          name="description"
                          defaultValue={routine.description}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">Days Active</label>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                            <label key={day} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              <input
                                type="checkbox"
                                name="days"
                                value={day}
                                defaultChecked={routine.days_of_week.includes(day)}
                                className="rounded text-emerald-600"
                              />
                              <span className="capitalize">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRoutineId(null)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REMINDER MANAGEMENT & ADHERENCE TRACKING */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          {/* Adherence Monitoring Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Reminders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalReminders}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{adherenceRate}% Adherence</p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Acknowledged</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{acknowledgedCount}</p>
              <p className="text-[11px] text-emerald-600">Followed promptly</p>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Postponed</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{postponedCount}</p>
              <p className="text-[11px] text-amber-600">Snoozed by patient</p>
            </div>

            <div className="bg-red-50/60 p-4 rounded-xl border border-red-200">
              <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Missed</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{missedCount}</p>
              <p className="text-[11px] text-red-600">No response</p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Scheduled</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{scheduledCount}</p>
              <p className="text-[11px] text-blue-600">Upcoming</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Active Reminders & Notifications
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create recurring and one-time reminders with voice readouts, push toasts, and memory-support prompts.
                </p>
              </div>

              <button
                onClick={() => setIsAddReminderOpen(!isAddReminderOpen)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
              >
                {isAddReminderOpen ? '✕ Close Form' : '+ Create Reminder'}
              </button>
            </div>

            {/* Create Reminder Form */}
            {isAddReminderOpen && (
              <form
                action={async (formData) => {
                  formData.set('patient_id', patientId);
                  await addReminder(null, formData);
                  setIsAddReminderOpen(false);
                  setStatusFeedback('Reminder created successfully.');
                }}
                className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-4 animate-in fade-in"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  New Reminder Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reminder Type *
                    </label>
                    <select
                      name="type"
                      defaultValue="recurring"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="recurring">Recurring (Daily / Every X hours)</option>
                      <option value="one_time">One-time (Specific Date & Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reminder Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g. Medicine, Drink Water, Doctor Visit"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduled_time"
                      required
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Recurrence Pattern (if recurring)
                    </label>
                    <input
                      type="text"
                      name="recurrence_rule"
                      placeholder="e.g. Every day @ 9 AM, Every 2 hours"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Supportive Description / Hint
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="e.g. Take with half a glass of warm water"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                    <input type="checkbox" name="voice_enabled" defaultChecked className="rounded text-emerald-600" />
                    <span>🔊 Voice Reminder ON</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                    <input type="checkbox" name="notification_enabled" defaultChecked className="rounded text-emerald-600" />
                    <span>🔔 Notification ON</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                    <input type="checkbox" name="memory_prompt_enabled" defaultChecked className="rounded text-emerald-600" />
                    <span>🧠 Memory-Support Prompt ON</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Create & Schedule Reminder
                </button>
              </form>
            )}

            {/* Reminders List with Status Pipeline */}
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const isRecurring = reminder.type === 'recurring';
                const statusColor = {
                  scheduled: 'bg-blue-100 text-blue-800',
                  delivered: 'bg-indigo-100 text-indigo-800',
                  acknowledged: 'bg-emerald-100 text-emerald-800',
                  postponed: 'bg-amber-100 text-amber-800',
                  missed: 'bg-red-100 text-red-800',
                }[reminder.status] || 'bg-gray-100 text-gray-800';

                return (
                  <div
                    key={reminder.id}
                    className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColor}`}>
                          {reminder.status}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {isRecurring ? '🔄 ' + (reminder.recurrence_rule || 'Recurring') : '📅 One-time'}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{reminder.title}</h4>
                      </div>

                      {reminder.description && (
                        <p className="text-xs text-gray-600">{reminder.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>🕒 {new Date(reminder.scheduled_time).toLocaleString()}</span>
                        {reminder.voice_enabled && <span>🔊 Voice</span>}
                        {reminder.memory_prompt_enabled && <span>🧠 Memory-Prompt</span>}
                      </div>
                    </div>

                    {/* Status Management Dropdown & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={reminder.status}
                        onChange={(e) =>
                          handleReminderStatusChange(reminder.id, e.target.value as ReminderStatus)
                        }
                        className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 font-medium"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="delivered">Delivered</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="postponed">Postponed</option>
                        <option value="missed">Missed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleReminderDelete(reminder.id)}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
