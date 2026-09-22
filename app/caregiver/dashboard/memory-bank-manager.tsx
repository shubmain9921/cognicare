'use client';

import { useState } from 'react';
import {
  addMemoryBankItem,
  updateMemoryStatus,
  deleteMemoryBankItem,
  MemoryActionResult,
} from '@/app/actions/memory-bank';
import type { DemoMemory } from '@/lib/demo-types';
import { MemoryCategory, MemoryStatus } from '@/types/database.types';

interface MemoryBankManagerProps {
  patientId: string;
  patientName: string;
  memories: DemoMemory[];
}

export default function MemoryBankManager({
  patientId,
  patientName,
  memories,
}: MemoryBankManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Items', icon: '🌟' },
    { id: 'person', label: 'People', icon: '👥' },
    { id: 'place', label: 'Places', icon: '📍' },
    { id: 'event', label: 'Memories & Events', icon: '🎉' },
    { id: 'preference', label: 'Preferences', icon: '❤️' },
    { id: 'routine', label: 'Routines', icon: '☕' },
  ];

  const filteredMemories =
    selectedCategory === 'all'
      ? memories
      : memories.filter((m) => m.category === selectedCategory);

  const handleStatusAdvance = async (memoryId: string, currentStatus: MemoryStatus) => {
    const nextMap: Record<MemoryStatus, MemoryStatus> = {
      new: 'introduced',
      introduced: 'practiced',
      practiced: 'recall_observed',
      recall_observed: 'recall_observed',
    };
    const nextStatus = nextMap[currentStatus];
    const res = await updateMemoryStatus(memoryId, patientId, nextStatus);
    if (res.success) {
      setStatusMessage(res.message || 'Status updated');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDelete = async (memoryId: string) => {
    const res = await deleteMemoryBankItem(memoryId, patientId);
    if (res.success) {
      setStatusMessage(res.message || 'Memory deleted');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Guidance Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span>❤️</span> Memory Bank for {patientName}
          </h2>
          <span className="text-xs bg-white/20 font-medium px-2.5 py-0.5 rounded-full">
            {memories.length} Trusted Memories
          </span>
        </div>
        <p className="text-xs text-emerald-100 leading-relaxed max-w-3xl">
          Caregiver adds trusted, meaningful information about people, places, events, and preferences. The AI uses this to personalize storytelling and recall games—<strong>without ever assuming the patient already remembers it</strong>.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
          {statusMessage}
        </div>
      )}

      {/* Category Pills & Action Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
        >
          {isAddOpen ? '✕ Close Form' : '+ Add Memory'}
        </button>
      </div>

      {/* Add Memory Form */}
      {isAddOpen && (
        <form
          action={async (formData) => {
            formData.set('patient_id', patientId);
            await addMemoryBankItem(null, formData);
            setIsAddOpen(false);
            setStatusMessage('New memory added to the introduction queue.');
          }}
          className="bg-white p-6 rounded-xl border border-emerald-300 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Introduce New Meaningful Memory
            </h3>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
              Status: New (Ready for Introduction)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                defaultValue="person"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="person">Person (e.g. Priya → Daughter, Aarav → Grandson)</option>
                <option value="place">Place (e.g. Home, City Hospital, Favorite Park)</option>
                <option value="event">Important Event (e.g. Wedding Anniversary, Birthday)</option>
                <option value="preference">Preference (e.g. Favorite Food, Favorite Song)</option>
                <option value="routine">Routine (e.g. Morning Walk, Evening Tea)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Key Term / Person / Subject *
              </label>
              <input
                type="text"
                name="key_term"
                required
                placeholder="e.g. Priya, Nehru Park, Masala Dosa"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Context & Meaningful Description *
            </label>
            <textarea
              name="description"
              required
              rows={2}
              placeholder="e.g. Daughter who lives in Mumbai and calls every Sunday evening."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <input type="hidden" name="status" value="new" />

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Save & Add to Memory Bank
          </button>
        </form>
      )}

      {/* Progressive Lifecycle Explanation Banner */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Memory Introduction & Recall Lifecycle:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="font-bold text-gray-800">1. New</span>
            <p className="text-[11px] text-gray-500 mt-0.5">Added by caregiver; queued for patient introduction.</p>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="font-bold text-blue-800">2. Introduced</span>
            <p className="text-[11px] text-blue-600 mt-0.5">Introduced gently: "This is Priya, your daughter."</p>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="font-bold text-amber-800">3. Practiced</span>
            <p className="text-[11px] text-amber-600 mt-0.5">Integrated into supportive games and stories.</p>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="font-bold text-emerald-800">4. Recall Observed</span>
            <p className="text-[11px] text-emerald-600 mt-0.5">Patient independently recalls correctly.</p>
          </div>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((mem) => {
          const statusBadge = {
            new: { bg: 'bg-gray-100 text-gray-800 border-gray-300', label: 'New' },
            introduced: { bg: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Introduced' },
            practiced: { bg: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Practiced' },
            recall_observed: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Recall Observed' },
          }[mem.status] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', label: mem.status };

          return (
            <div
              key={mem.id}
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full capitalize">
                    {mem.category}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900">{mem.key_term}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{mem.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                {mem.status !== 'recall_observed' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusAdvance(mem.id, mem.status)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded border border-emerald-200 text-[11px] transition"
                  >
                    Advance Stage ➔
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Mastered Recall</span>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(mem.id)}
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
  );
}
