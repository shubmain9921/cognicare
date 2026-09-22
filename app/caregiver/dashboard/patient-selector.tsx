'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PatientOption {
  id: string;
  name: string;
  patient_code: string;
}

export default function PatientSelector({
  patients,
  selectedPatientId,
}: {
  patients: PatientOption[];
  selectedPatientId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (patientId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('patientId', patientId);
    router.push(`/caregiver/dashboard?${params.toString()}`);
  };

  if (patients.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-semibold hidden md:inline">Patient:</span>
      <select
        id="patient-select"
        value={selectedPatientId}
        onChange={(e) => handleSelect(e.target.value)}
        className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
      >
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.patient_code})
          </option>
        ))}
      </select>
    </div>
  );
}
