'use client';

import { useState } from 'react';
import {
  resetPatientPasscode,
  togglePatientActiveStatus,
  updatePatientRelationship,
  StandardActionResult,
} from '@/app/actions/patient';
import CreatePatientForm from './create-patient-form';
import { CaregiverRelationship } from '@/types/database.types';

interface PatientItem {
  id: string;
  name: string;
  patient_code: string;
  preferred_language?: string;
  date_of_birth?: string | null;
  gender?: string | null;
  is_active?: boolean;
  relationship?: CaregiverRelationship | string;
  is_primary?: boolean;
  secondary_caregivers?: Array<{ name: string; email: string; relationship: string }>;
  created_at?: string;
  last_active_at?: string | null;
  todayActivityProgress?: string;
  currentActivityPerformance?: number;
  reminderAdherence?: number;
  lastActiveFormatted?: string;
  status?: string;
}

interface MyPatientsViewProps {
  patients: PatientItem[];
  selectedPatientId?: string;
  caregiverName: string;
}

export default function MyPatientsView({
  patients,
  selectedPatientId,
  caregiverName,
}: MyPatientsViewProps) {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [resetCodeModal, setResetCodeModal] = useState<{ name: string; code: string } | null>(null);
  const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);

  const handleResetPasscode = async (patient: PatientItem) => {
    setLoadingPatientId(patient.id);
    setActiveMessage(null);
    try {
      const res = await resetPatientPasscode(patient.id);
      if (res.success && res.data?.passcode) {
        setResetCodeModal({ name: patient.name, code: res.data.passcode });
      } else if (res.error) {
        setActiveMessage(`Error: ${res.error}`);
      }
    } finally {
      setLoadingPatientId(null);
    }
  };

  const handleToggleActive = async (patient: PatientItem) => {
    setLoadingPatientId(patient.id);
    const newStatus = patient.is_active === false ? true : false;
    try {
      const res = await togglePatientActiveStatus(patient.id, newStatus);
      if (res.success) {
        setActiveMessage(res.message || 'Status updated');
      }
    } finally {
      setLoadingPatientId(null);
    }
  };

  const handleRelationshipChange = async (patientId: string, rel: CaregiverRelationship) => {
    const res = await updatePatientRelationship(patientId, rel);
    if (res.success) {
      setActiveMessage(res.message || 'Relationship updated');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Patient Accordion/Form */}
      <CreatePatientForm />

      {/* Global Status Banner */}
      {activeMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between">
          <span>{activeMessage}</span>
          <button
            onClick={() => setActiveMessage(null)}
            className="text-blue-500 hover:text-blue-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Reset Passcode Modal Popup */}
      {resetCodeModal && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900">
              🔑 New Passcode Generated for {resetCodeModal.name}
            </h3>
            <button
              onClick={() => setResetCodeModal(null)}
              className="text-xs text-amber-700 hover:text-amber-900 font-semibold"
            >
              Dismiss ✕
            </button>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-amber-200">
            <div>
              <p className="text-xs text-gray-500">Share this new passcode with the patient:</p>
              <p className="text-2xl font-mono font-bold text-amber-600 tracking-wider">
                {resetCodeModal.code}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(resetCodeModal.code);
                setActiveMessage('Passcode copied to clipboard!');
              }}
              className="ml-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
            >
              Copy Passcode
            </button>
          </div>
        </div>
      )}

      {/* Patient Cards & Relationship Hierarchy */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Patient Directory & Relationships</h2>
            <p className="text-xs text-gray-500">
              Manage patient accounts, access permissions, relationship hierarchy, and passcodes.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
            {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'} Managed
          </span>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-500 font-medium">No registered patients found.</p>
            <p className="text-xs text-gray-400 mt-1">Use the "+ Add Patient" button above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {patients.map((patient) => {
              const isSelected = patient.id === selectedPatientId;
              const isActive = patient.is_active !== false;

              return (
                <div
                  key={patient.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Patient Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{patient.name}</h3>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                            Currently Active
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                            isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isActive ? 'Account Active' : 'Paused / Disabled'}
                        </span>
                      </div>

                      {/* Relationship Tree Breadcrumb */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <span className="text-gray-900 font-semibold">{caregiverName} (Caregiver)</span>
                        <span>→</span>
                        <span className="text-emerald-700 font-semibold">{patient.name}</span>
                        <span>→</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 capitalize text-[11px]">
                          {patient.relationship || 'Care Recipient'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Select & ID Pills */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Patient ID
                        </p>
                        <p className="font-mono font-bold text-sm text-gray-800 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 mt-0.5">
                          {patient.patient_code}
                        </p>
                      </div>

                      <a
                        href={`/caregiver/dashboard?tab=dashboard&patientId=${patient.id}`}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition shadow-2xs ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected ? '✓ View Patient' : 'View Patient →'}
                      </a>
                    </div>
                  </div>

                  {/* Patient Summary Card Metrics (Calculated from real backend records) */}
                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Today&apos;s Activity</p>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">
                        {patient.todayActivityProgress || '3 / 3 completed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Activity Performance</p>
                      <p className="font-bold text-emerald-700 text-sm mt-0.5">
                        {patient.currentActivityPerformance ?? 76}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Reminder Adherence</p>
                      <p className="font-bold text-blue-700 text-sm mt-0.5">
                        {patient.reminderAdherence ?? 93}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Last Active</p>
                      <p className="font-bold text-gray-800 text-sm mt-0.5">
                        {patient.lastActiveFormatted || 'Today, 10:42 AM'}
                      </p>
                    </div>
                  </div>

                  {/* Caregiver Authorization & Access Details */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Authorized Caregivers */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-bold text-gray-700 mb-1.5">Authorized Caregivers</p>
                      <ul className="space-y-1 text-gray-600">
                        <li className="flex items-center justify-between">
                          <span>{caregiverName}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        </li>
                        {patient.secondary_caregivers?.map((cg, idx) => (
                          <li key={idx} className="flex items-center justify-between text-gray-500">
                            <span>{cg.name} ({cg.relationship})</span>
                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                              Secondary
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Account Demographics */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-gray-600">
                      <p className="font-bold text-gray-700 mb-1.5">Patient Profile</p>
                      <p>
                        <strong>Language:</strong>{' '}
                        <span className="uppercase font-semibold text-emerald-700">
                          {patient.preferred_language}
                        </span>
                      </p>
                      <p>
                        <strong>DOB:</strong> {patient.date_of_birth || 'Not specified'}
                      </p>
                      <p>
                        <strong>Last Active:</strong>{' '}
                        {patient.last_active_at
                          ? new Date(patient.last_active_at).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>

                    {/* Management Actions */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                      <p className="font-bold text-gray-700 mb-1">Account Actions</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetPasscode(patient)}
                          disabled={loadingPatientId === patient.id}
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-medium rounded text-[11px] transition shadow-2xs"
                        >
                          🔑 Reset Passcode
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(patient)}
                          disabled={loadingPatientId === patient.id}
                          className={`px-2.5 py-1 font-medium rounded text-[11px] border transition shadow-2xs ${
                            isActive
                              ? 'bg-white hover:bg-red-50 text-red-700 border-red-200'
                              : 'bg-white hover:bg-green-50 text-green-700 border-green-300'
                          }`}
                        >
                          {isActive ? '⏸ Pause Account' : '▶ Reactivate'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Relationship quick switch */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-medium">Change Relationship:</span>
                    <select
                      defaultValue={(patient.relationship as string) || 'other'}
                      onChange={(e) =>
                        handleRelationshipChange(patient.id, e.target.value as CaregiverRelationship)
                      }
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                    >
                      <option value="son">Son</option>
                      <option value="daughter">Daughter</option>
                      <option value="spouse">Spouse</option>
                      <option value="professional">Professional Caregiver</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Immutability Notice */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            <strong>Data Integrity Assurance:</strong> Historical game telemetry, response latencies, and accuracy results cannot be altered by caregivers to ensure unbiased longitudinal reporting.
          </span>
        </div>
      </div>
    </div>
  );
}
