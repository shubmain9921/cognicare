'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createPatient, CreatePatientResult } from '@/app/actions/patient';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-sm"
    >
      {pending ? 'Creating Patient...' : 'Create Patient & Generate Passcode'}
    </button>
  );
}

export default function CreatePatientForm({
  onPatientCreated,
}: {
  onPatientCreated?: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState<CreatePatientResult | null, FormData>(
    createPatient,
    null
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state?.success && state.patient) {
      if (onPatientCreated) {
        onPatientCreated();
      }
    }
  }, [state, onPatientCreated]);

  const handleCopyCredentials = (id: string, pin: string) => {
    navigator.clipboard.writeText(`CogniCare Credentials\nPatient ID: ${id}\nPasscode: ${pin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSelectCreatedPatient = (patientId: string) => {
    router.push(`/caregiver/dashboard?tab=dashboard&patientId=${patientId}`);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Add New Patient</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Register a patient under your care. The system will automatically generate a secure Patient ID and Passcode.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
        >
          {isOpen ? '✕ Close Form' : '+ Add Patient'}
        </button>
      </div>

      {/* Generated Credentials Success Card */}
      {state?.success && state.patient && (
        <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-bold text-emerald-900">
                Patient Account Created Successfully!
              </h3>
            </div>
            <span className="text-xs bg-emerald-200/60 text-emerald-800 font-medium px-2 py-0.5 rounded">
              Ready to Share
            </span>
          </div>

          <p className="text-xs text-emerald-800">
            Share these auto-generated credentials with <strong>{state.patient.name}</strong> or their on-site support. The patient should use these to log into their portal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-emerald-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</p>
              <p className="text-xl font-mono font-bold text-gray-900 tracking-wide mt-0.5">
                {state.patient.patient_code}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Passcode (PIN)</p>
              <p className="text-xl font-mono font-bold text-emerald-600 tracking-wider mt-0.5">
                {state.patient.pin}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSelectCreatedPatient(state.patient!.id)}
              className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded transition flex items-center gap-1.5"
            >
              ➔ View {state.patient.name}&apos;s Dashboard
            </button>
            <button
              type="button"
              onClick={() => handleCopyCredentials(state.patient!.patient_code, state.patient!.pin)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition flex items-center gap-1.5"
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Credentials'}
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <form action={formAction} className="mt-6 pt-6 border-t border-gray-100 space-y-4">
          {state?.error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="name">
                Patient Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Anita Sharma"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="relationship">
                Your Relationship to Patient *
              </label>
              <select
                id="relationship"
                name="relationship"
                defaultValue="son"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="son">Son</option>
                <option value="daughter">Daughter</option>
                <option value="spouse">Spouse</option>
                <option value="professional">Professional Caregiver</option>
                <option value="other">Other Relative / Guardian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="date_of_birth">
                Date of Birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="gender">
                Gender (Optional)
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue="Female"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="preferred_language">
                Patient Preferred Language
              </label>
              <select
                id="preferred_language"
                name="preferred_language"
                defaultValue="as"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="as">Assamese (অসমীয়া)</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="es">Spanish (Español)</option>
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Your caregiver dashboard stays in English while patient games and voice adapt to this language.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="text_size">
                Patient UI Text Size
              </label>
              <select
                id="text_size"
                name="text_size"
                defaultValue="large"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="medium">Standard / Medium</option>
                <option value="large">Large (High Legibility)</option>
                <option value="xlarge">Extra Large</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="voice_enabled"
              name="voice_enabled"
              defaultChecked
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="voice_enabled" className="text-xs font-medium text-gray-700 cursor-pointer">
              Enable spoken voice prompts and memory read-outs for this patient
            </label>
          </div>

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      )}
    </div>
  );
}
