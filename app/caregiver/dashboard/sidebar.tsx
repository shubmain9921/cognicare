'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { caregiverLogout } from '@/app/actions/auth';

import { useI18n } from '@/lib/i18n/context';

interface SidebarProps {
  activeTab: string;
  patientId?: string;
  patientName?: string;
  caregiverName: string;
  caregiverEmail: string;
  totalPatients: number;
}

export default function CaregiverSidebar({
  activeTab,
  patientId,
  patientName,
  caregiverName,
  caregiverEmail,
  totalPatients,
}: SidebarProps) {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const currentPatientId = patientId || searchParams.get('patientId') || '';

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard.overview'),
      icon: '🏠',
      description: "Today's summary & AI insights",
    },
    {
      id: 'patients',
      label: t('dashboard.myPatients'),
      icon: '👥',
      description: 'Profiles & relationships',
    },
    {
      id: 'reminders',
      label: t('dashboard.routines'),
      icon: '🔔',
      description: 'My Day schedule & adherence',
    },
    {
      id: 'memory-bank',
      label: t('dashboard.memoryBank'),
      icon: '❤️',
      description: 'People, places & lifecycle',
    },
    {
      id: 'activities',
      label: t('dashboard.activities'),
      icon: '🧠',
      description: 'Quotas, preferences & focus',
    },
    {
      id: 'reports',
      label: t('dashboard.reports'),
      icon: '📊',
      description: 'Weekly summaries & trends',
    },
    {
      id: 'settings',
      label: t('dashboard.settings'),
      icon: '⚙️',
      description: 'Languages & accessibility',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 shadow-sm md:min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Active Patient Scope Context Card */}
        {patientName ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Active Patient
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {patientName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{patientName}</p>
                <p className="text-[11px] text-gray-500 truncate">Scoped view active</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <p className="text-xs text-gray-600">No active patient selected</p>
          </div>
        )}

        {/* Navigation Menu Items */}
        <nav className="space-y-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Caregiver Controls
          </p>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const queryParams = new URLSearchParams();
            queryParams.set('tab', item.id);
            if (currentPatientId) {
              queryParams.set('patientId', currentPatientId);
            }

            return (
              <Link
                key={item.id}
                href={`/caregiver/dashboard?${queryParams.toString()}`}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-gray-700 hover:bg-emerald-50/50 hover:text-emerald-900'
                }`}
              >
                <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                <div className="min-w-0">
                  <p className={`text-sm leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p
                    className={`text-[11px] leading-tight truncate mt-0.5 ${
                      isActive ? 'text-emerald-100' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Caregiver Profile Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center justify-center text-xs">
            {caregiverName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{caregiverName}</p>
            <p className="text-[11px] text-gray-500 truncate">{caregiverEmail}</p>
          </div>
        </div>

        <form action={caregiverLogout}>
          <button
            type="submit"
            className="w-full py-1.5 px-3 bg-white hover:bg-red-50 hover:text-red-700 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition text-center shadow-2xs"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
