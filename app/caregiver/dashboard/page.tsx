import { createClient } from '@/lib/supabase/server';
import { caregiverLogout } from '@/app/actions/auth';
import CaregiverSidebar from './sidebar';
import DashboardOverviewView from './dashboard-overview-view';
import MyPatientsView from './my-patients-view';
import RemindersAndRoutinesView from './reminders-and-routines-view';
import MemoryBankManager from './memory-bank-manager';
import ActivitiesManager from './activities-manager';
import ReportsView from './reports-view';
import SettingsView from './settings-view';
import PatientSelector from './patient-selector';
import { redirect } from 'next/navigation';
import {
  getDemoCaregiver,
  getDemoPatients,
  getDemoMemories,
  getDemoReminders,
  getDemoRoutines,
  isDemoMode,
  DemoPatient,
} from '@/lib/demo-mode';
import { ChartSessionData, ReminderStatData } from './patient-charts';
import { WeeklyReportItem } from './weekly-report-card';
import { getDailyCognitiveUsage } from '@/lib/safety-limits';
import { getCaregiverDashboardData } from '@/lib/caregiver-dashboard';
import { getDictionary, t } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import { CaregiverHeaderLanguageSwitcher } from '@/components/language-switcher';

export const dynamic = 'force-dynamic';

export default async function CaregiverDashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string; patientId?: string };
}) {
  const activeTab = searchParams?.tab || 'dashboard';

  // ==========================================
  // 1. DEMO MODE DATA PIPELINE
  // ==========================================
  if (isDemoMode()) {
    const dashboardData = await getCaregiverDashboardData({
      patientId: searchParams?.patientId,
    });
    const caregiver = dashboardData.caregiver;
    const patientList = getDemoPatients();
    const selectedPatient = dashboardData.selectedPatient || patientList[0];

    const memories = getDemoMemories(selectedPatient.id);
    const reminders = getDemoReminders(selectedPatient.id);
    const routines = getDemoRoutines(selectedPatient.id);

    const chartSessions: ChartSessionData[] = dashboardData.recentActivities.map((s) => ({
      id: s.id,
      gameName: s.gameName,
      accuracyPct: s.accuracyPct,
      avgResponseTimeMs: s.avgResponseTimeMs,
      difficulty: s.difficulty,
      playedAt: s.playedAt,
      formattedDate: s.formattedDate,
    }));

    const weeklyReports: WeeklyReportItem[] = [
      {
        id: 'demo-rep-1',
        patient_id: selectedPatient.id,
        week_start: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        summary_text:
          dashboardData.aiObservations[0]?.message ||
          'Visual memory performance remains strong at 82%. Routine recall has shown slight baseline variation (59%).',
        metrics_json: {
          memory: dashboardData.gamePerformance.find((g) => g.name === 'Remember the Objects')?.score || 82,
          sequence: dashboardData.gamePerformance.find((g) => g.name === 'Sequence Recall')?.score || 68,
          routine: dashboardData.gamePerformance.find((g) => g.name === 'Daily Routine Recall')?.score || 59,
          adherence: Math.round(dashboardData.reminderStats.adherenceRatePct),
        },
        created_at: new Date().toISOString(),
      },
    ];

    return (
      <I18nProvider locale={caregiver.preferred_language || 'en'} dictionary={getDictionary(caregiver.preferred_language || 'en')}>
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-xs">
                🧠
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  CogniCare <span className="text-emerald-700 font-semibold text-xs ml-1">Caregiver Portal</span>
                </h1>
                <p className="text-[11px] text-gray-500">
                  Caregiver: <strong>{caregiver.name}</strong> • Portal Language:{' '}
                  <span className="uppercase font-semibold text-emerald-700">
                    {caregiver.preferred_language}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {patientList.length > 0 && selectedPatient && (
                <div className="hidden sm:block">
                  <PatientSelector
                    patients={patientList}
                    selectedPatientId={selectedPatient.id}
                  />
                </div>
              )}
              <CaregiverHeaderLanguageSwitcher />
              <form action={caregiverLogout}>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition shadow-2xs"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </header>

        {/* Dashboard Shell with Persistent Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row">
          <CaregiverSidebar
            activeTab={activeTab}
            patientId={selectedPatient?.id}
            patientName={selectedPatient?.name}
            caregiverName={caregiver.name}
            caregiverEmail={caregiver.email}
            totalPatients={patientList.length}
          />

          {/* Main Scoped Content Pane */}
          <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* Mobile Patient Switcher */}
            {patientList.length > 0 && selectedPatient && (
              <div className="sm:hidden">
                <PatientSelector
                  patients={patientList}
                  selectedPatientId={selectedPatient.id}
                />
              </div>
            )}

            {/* TAB ROUTING */}
            {activeTab === 'dashboard' && (
              <DashboardOverviewView
                patient={selectedPatient}
                routines={routines}
                reminders={reminders}
                memories={memories}
                chartSessions={chartSessions}
                reminderStats={dashboardData.reminderStats}
                dailyUsage={dashboardData.overview.todayUsage}
                overview={dashboardData.overview}
                dailyPerformance={dashboardData.dailyPerformance}
                gamePerformance={dashboardData.gamePerformance}
                aiObservations={dashboardData.aiObservations}
                attentionItems={dashboardData.attentionItems}
                recentActivities={dashboardData.recentActivities}
              />
            )}

            {activeTab === 'patients' && (
              <MyPatientsView
                patients={dashboardData.patients}
                selectedPatientId={selectedPatient?.id}
                caregiverName={caregiver.name}
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersAndRoutinesView
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                routines={routines}
                reminders={reminders}
              />
            )}

            {activeTab === 'memory-bank' && (
              <MemoryBankManager
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                memories={memories}
              />
            )}

            {activeTab === 'activities' && (
              <ActivitiesManager patient={selectedPatient} />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                reports={weeklyReports}
                sessions={chartSessions}
                reminderStats={dashboardData.reminderStats}
                weeklyAverage={dashboardData.overview.weeklyAverage}
                previousWeekAverage={dashboardData.overview.previousWeekAverage}
                weeklyTrendLabel={dashboardData.overview.weeklyTrendLabel}
                sessionsCompleted={dashboardData.overview.todaySessionsCompleted}
                gamePerformance={dashboardData.gamePerformance}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                caregiverName={caregiver.name}
                caregiverEmail={caregiver.email}
                caregiverLanguage={caregiver.preferred_language}
                patient={selectedPatient}
              />
            )}
          </main>
        </div>
      </div>
    </I18nProvider>
  );
  }

  // ==========================================
  // 2. SUPABASE PRODUCTION DATA PIPELINE
  // ==========================================
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/caregiver/login');
  }

  // Fetch caregiver profile
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id, name, email, preferred_language')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch patients assigned to caregiver
  const { data: patients } = await supabase
    .from('patients')
    .select(`
      id,
      caregiver_id,
      name,
      patient_code,
      preferred_language,
      date_of_birth,
      gender,
      time_zone,
      is_active,
      voice_enabled,
      text_size,
      daily_target_activities,
      session_duration_minutes,
      preferred_activity_time,
      preferred_activity_types,
      last_active_at,
      created_at
    `)
    .eq('caregiver_id', user.id)
    .order('created_at', { ascending: false });

  const patientList: DemoPatient[] = (patients || []).map((p: any) => ({
    id: p.id,
    caregiver_id: p.caregiver_id,
    name: p.name,
    patient_code: p.patient_code,
    pin: '••••••',
    preferred_language: p.preferred_language || 'en',
    date_of_birth: p.date_of_birth || '',
    gender: p.gender || '',
    time_zone: p.time_zone || 'UTC',
    is_active: p.is_active !== false,
    voice_enabled: p.voice_enabled !== false,
    text_size: p.text_size || 'medium',
    daily_target_activities: p.daily_target_activities || 3,
    session_duration_minutes: p.session_duration_minutes || 10,
    preferred_activity_time: p.preferred_activity_time || 'morning',
    preferred_activity_types: p.preferred_activity_types || ['memory', 'sequence', 'routine'],
    relationship: 'son',
    is_primary: true,
    last_active_at: p.last_active_at || '',
    created_at: p.created_at,
  }));

  let selectedPatient = patientList.find((p) => p.id === searchParams?.patientId);
  if (!selectedPatient && patientList.length > 0) {
    selectedPatient = patientList[0];
  }

  let memories: any[] = [];
  let reminders: any[] = [];
  let routines: any[] = [];
  let gameSessions: any[] = [];
  let weeklyReports: WeeklyReportItem[] = [];

  if (selectedPatient) {
    const [memoriesRes, remindersRes, routinesRes, sessionsRes, reportsRes] = await Promise.all([
      supabase
        .from('memory_bank')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reminders')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('scheduled_time', { ascending: true }),
      supabase
        .from('daily_routines')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('time_of_day', { ascending: true }),
      supabase
        .from('game_sessions')
        .select(`
          id,
          game_id,
          difficulty_level,
          accuracy,
          avg_response_time_ms,
          mistakes,
          completed,
          played_at,
          games (
            name
          )
        `)
        .eq('patient_id', selectedPatient.id)
        .order('played_at', { ascending: true })
        .limit(20),
      supabase
        .from('weekly_reports')
        .select('*')
        .eq('patient_id', selectedPatient.id)
        .order('created_at', { ascending: false }),
    ]);

    memories = memoriesRes.data || [];
    reminders = remindersRes.data || [];
    routines = routinesRes.data || [];
    gameSessions = sessionsRes.data || [];
    weeklyReports = (reportsRes.data as unknown as WeeklyReportItem[]) || [];
  }

  const dashboardData = await getCaregiverDashboardData({
    caregiverId: user.id,
    patientId: selectedPatient?.id,
  });

  const chartSessions: ChartSessionData[] = gameSessions.map((s: any) => {
    const d = new Date(s.played_at);
    const formattedDate = `${d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

    const acc = s.accuracy > 1 ? s.accuracy : s.accuracy * 100;

    return {
      id: s.id,
      gameName: s.games?.name || 'Cognitive Game',
      accuracyPct: Math.round(acc),
      avgResponseTimeMs: s.avg_response_time_ms,
      difficulty: s.difficulty_level,
      playedAt: s.played_at,
      formattedDate,
    };
  });

  const totalReminders = reminders.length;
  const doneReminders = reminders.filter((r) => r.is_done || r.status === 'acknowledged').length;
  const reminderStats: ReminderStatData = {
    total: totalReminders,
    completed: doneReminders,
    adherenceRatePct:
      totalReminders > 0 ? Math.round((doneReminders / totalReminders) * 100) : 100,
  };

  const cgName = caregiver?.name || user.email?.split('@')[0] || 'Caregiver';
  const cgEmail = user.email || '';
  const cgLang = caregiver?.preferred_language || 'en';

  return (
    <I18nProvider locale={cgLang} dictionary={getDictionary(cgLang)}>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-xs">
              🧠
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                CogniCare <span className="text-emerald-700 font-semibold text-xs ml-1">Caregiver Portal</span>
              </h1>
              <p className="text-[11px] text-gray-500">
                Caregiver: <strong>{cgName}</strong> • Portal Language:{' '}
                <span className="uppercase font-semibold text-emerald-700">{cgLang}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {patientList.length > 0 && selectedPatient && (
              <div className="hidden sm:block">
                <PatientSelector
                  patients={patientList}
                  selectedPatientId={selectedPatient.id}
                />
              </div>
            )}
            <CaregiverHeaderLanguageSwitcher />
            <form action={caregiverLogout}>
              <button
                type="submit"
                className="py-1.5 px-3 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition shadow-2xs"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

      {/* Dashboard Shell with Persistent Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        <CaregiverSidebar
          activeTab={activeTab}
          patientId={selectedPatient?.id}
          patientName={selectedPatient?.name}
          caregiverName={cgName}
          caregiverEmail={cgEmail}
          totalPatients={patientList.length}
        />

        {/* Main Scoped Content Pane */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Mobile Patient Switcher */}
          {patientList.length > 0 && selectedPatient && (
            <div className="sm:hidden">
              <PatientSelector
                patients={patientList}
                selectedPatientId={selectedPatient.id}
              />
            </div>
          )}

          {/* TAB ROUTING */}
          {selectedPatient ? (
            <>
              {activeTab === 'dashboard' && (
                <DashboardOverviewView
                  patient={selectedPatient}
                  routines={routines}
                  reminders={reminders}
                  memories={memories}
                  chartSessions={chartSessions}
                  reminderStats={dashboardData.reminderStats}
                  dailyUsage={dashboardData.overview.todayUsage}
                  overview={dashboardData.overview}
                  dailyPerformance={dashboardData.dailyPerformance}
                  gamePerformance={dashboardData.gamePerformance}
                  aiObservations={dashboardData.aiObservations}
                  attentionItems={dashboardData.attentionItems}
                  recentActivities={dashboardData.recentActivities}
                />
              )}

              {activeTab === 'patients' && (
                <MyPatientsView
                  patients={dashboardData.patients}
                  selectedPatientId={selectedPatient?.id}
                  caregiverName={cgName}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersAndRoutinesView
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  routines={routines}
                  reminders={reminders}
                />
              )}

              {activeTab === 'memory-bank' && (
                <MemoryBankManager
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  memories={memories}
                />
              )}

              {activeTab === 'activities' && (
                <ActivitiesManager patient={selectedPatient} />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  patientId={selectedPatient.id}
                  patientName={selectedPatient.name}
                  reports={weeklyReports}
                  sessions={chartSessions}
                  reminderStats={dashboardData.reminderStats}
                  weeklyAverage={dashboardData.overview.weeklyAverage}
                  previousWeekAverage={dashboardData.overview.previousWeekAverage}
                  weeklyTrendLabel={dashboardData.overview.weeklyTrendLabel}
                  sessionsCompleted={dashboardData.overview.todaySessionsCompleted}
                  gamePerformance={dashboardData.gamePerformance}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  caregiverName={cgName}
                  caregiverEmail={cgEmail}
                  caregiverLanguage={cgLang}
                  patient={selectedPatient}
                />
              )}
            </>
          ) : (
            <MyPatientsView
              patients={patientList}
              caregiverName={cgName}
            />
          )}
        </main>
      </div>
    </div>
  </I18nProvider>
  );
}
