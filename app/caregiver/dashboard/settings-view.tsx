'use client';

import { useState } from 'react';
import { updateCaregiverProfile } from '@/app/actions/caregiver';
import { updatePatientPreferences } from '@/app/actions/patient';
import type { DemoPatient } from '@/lib/demo-types';

interface SettingsViewProps {
  caregiverName: string;
  caregiverEmail: string;
  caregiverLanguage: string;
  patient: DemoPatient;
}

export default function SettingsView({
  caregiverName,
  caregiverEmail,
  caregiverLanguage,
  patient,
}: SettingsViewProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* SECTION 1: CAREGIVER ACCOUNT SETTINGS */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-900">Caregiver Account & Language</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your personal profile and preferred portal language.
          </p>
        </div>

        <form
          action={async (formData) => {
            const res = await updateCaregiverProfile(formData);
            if (res.success) {
              setFeedback(res.message || 'Caregiver profile updated');
              setTimeout(() => setFeedback(null), 3000);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cg_name">
                Caregiver Name
              </label>
              <input
                id="cg_name"
                name="name"
                type="text"
                defaultValue={caregiverName}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                defaultValue={caregiverEmail}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cg_lang">
                Caregiver Portal Language
              </label>
              <select
                id="cg_lang"
                name="preferred_language"
                defaultValue={caregiverLanguage || 'en'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="as">Assamese (অসমীয়া)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Save Caregiver Settings
          </button>
        </form>
      </div>

      {/* SECTION 2: PATIENT LANGUAGE & ACCESSIBILITY PREFERENCES */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Patient Preferences & Accessibility ({patient.name})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure patient experience without forcing the patient through complicated settings menus.
            </p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
            Decoupled Multi-Language Active
          </span>
        </div>

        {/* Multi-language clarity card */}
        <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span>
              <strong>Language Decoupling:</strong> Caregiver portal operates in <strong>{caregiverLanguage === 'hi' ? 'Hindi' : caregiverLanguage === 'mr' ? 'Marathi' : caregiverLanguage === 'as' ? 'Assamese' : 'English'}</strong> while {patient.name} experiences games and voice prompts in{' '}
              <strong className="uppercase">{patient.preferred_language === 'mr' ? 'Marathi' : patient.preferred_language === 'hi' ? 'Hindi' : patient.preferred_language === 'as' ? 'Assamese' : 'English'}</strong>.
            </span>
          </div>
        </div>

        <form
          action={async (formData) => {
            const res = await updatePatientPreferences(patient.id, formData);
            if (res.success) {
              setFeedback(res.message || 'Patient preferences updated');
              setTimeout(() => setFeedback(null), 3000);
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="p_lang">
                Patient Game & Interface Language
              </label>
              <select
                id="p_lang"
                name="preferred_language"
                defaultValue={patient.preferred_language || 'en'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="as">Assamese (অসমীয়া)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="p_text_size">
                Patient Text Size
              </label>
              <select
                id="p_text_size"
                name="text_size"
                defaultValue={patient.text_size || 'large'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="medium">Standard / Medium</option>
                <option value="large">Large (High Legibility)</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="voice_enabled"
                defaultChecked={patient.voice_enabled ?? true}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>Enable spoken audio voice assistance and story readouts for {patient.name}</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            Save Patient Preferences
          </button>
        </form>
      </div>
    </div>
  );
}
