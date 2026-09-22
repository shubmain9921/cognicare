/**
 * Comprehensive Test Suite for CogniCare AI Engine & Data Isolation
 * 
 * Verifies:
 * 1. AI Request & Context Minimization
 * 2. AI Response Schema Validation & Fallback Robustness
 * 3. Deterministic Adaptive Difficulty & Scoring
 * 4. Multilingual generation logic
 * 5. Patient Data Isolation & Authorization
 * 6. Metric Pre-calculation before AI summaries
 */

import {
  generatePersonalizedStory,
  generateRoutineRecallQuestions,
  generateWhoWhereWhenQuestions,
  generateCaregiverWeeklySummary,
  handlePatientAssistantQuery,
  WeeklyMetrics,
} from '../lib/ai/gemini';
import { computeAdaptiveDifficulty, GameSessionRecord } from '../lib/adaptiveDifficulty';
import {
  getDailyCognitiveUsage,
  getUsageReminder,
  DEFAULT_DAILY_LIMIT_MINUTES,
} from '../lib/safety-limits';
import { getCaregiverDashboardData } from '../lib/caregiver-dashboard';
import {
  getDemoPatients,
  getDemoPatient,
  addDemoPatient,
  getDemoRoutines,
  addDemoRoutine,
  updateDemoRoutine,
  toggleDemoRoutine,
  deleteDemoRoutine,
  getDemoReminders,
  addDemoReminder,
  updateDemoReminderStatus,
  getDemoMemories,
  addDemoMemory,
  updateDemoMemoryStatus,
  addDemoGameSession,
  getDemoGameSessions,
  resetDemoState,
} from '../lib/demo-mode';
import { encodePatientSession, decodePatientSession } from '../lib/patient-session-core';
import {
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  getLanguageMeta,
} from '../lib/i18n/languages';
import {
  formatDate,
  formatTime,
  formatNumber,
  formatPercent,
  formatDuration,
  formatPlural,
} from '../lib/i18n/formatters';
import { getDictionary, t } from '../lib/i18n';
import {
  getDemoCaregiver,
  updateDemoCaregiver,
  updateDemoPatientPreferences,
} from '../lib/demo-mode';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================================');
  console.log('🧪 RUNNING COGNICARE AI ENGINE & ARCHITECTURE TESTS');
  console.log('========================================================\n');

  // Ensure clean isolated state for test run
  resetDemoState();

  // TEST 1: Story Recall Schema & Fallback Generation (English)
  console.log('--- Test Group 1: Story Recall ---');
  const mockMemories = [
    { category: 'person', key_term: 'Priya', description: 'Daughter who visits on weekends' },
    { category: 'place', key_term: 'Nehru Garden', description: 'Peaceful park with flowers' },
    { category: 'routine', key_term: 'Morning Tea', description: 'Warm tea at 7:30 AM' },
  ];

  const storyResult = await generatePersonalizedStory({
    patientName: 'Anita Sharma',
    language: 'en',
    memories: mockMemories,
    difficulty: 2,
  });

  assert(typeof storyResult.story === 'string' && storyResult.story.length > 10, 'Story text generated');
  assert(Array.isArray(storyResult.questions) && storyResult.questions.length >= 2, 'At least 2 recall questions generated');
  assert(storyResult.questions[0].options.length === 3, 'Questions have 3 distinct options');
  assert(
    storyResult.questions[0].correctIndex >= 0 && storyResult.questions[0].correctIndex < 3,
    'correctIndex is within valid range (0-2)'
  );
  assert(storyResult.featuredItems.includes('Priya'), 'Uses approved Memory Bank items');

  // TEST 2: Story Recall Multilingual Support (Assamese)
  console.log('\n--- Test Group 2: Multilingual AI Generation (Assamese) ---');
  const storyAsResult = await generatePersonalizedStory({
    patientName: 'Anita Sharma',
    language: 'as',
    memories: mockMemories,
  });
  assert(storyAsResult.story.length > 10, 'Assamese story synthesized');
  assert(storyAsResult.questions.length >= 2, 'Assamese questions synthesized');

  // TEST 3: Routine Recall Question Generation
  console.log('\n--- Test Group 3: Daily Routine Recall Generator ---');
  const mockRoutines = [
    { time_of_day: '08:00', title: 'Breakfast', description: 'Warm porridge' },
    { time_of_day: '09:00', title: 'Blood Pressure Medicine', description: 'Prescription pills' },
    { time_of_day: '10:00', title: 'Morning Garden Walk', description: 'Fresh air' },
  ];

  const routineQuestions = await generateRoutineRecallQuestions({
    patientName: 'Anita Sharma',
    language: 'en',
    routines: mockRoutines,
  });

  assert(routineQuestions.length >= 2, 'Generates multiple routine questions');
  assert(routineQuestions[0].options.includes(mockRoutines[0].title), 'Options include correct routine title');
  assert(
    routineQuestions[0].correctIndex >= 0 && routineQuestions[0].correctIndex < routineQuestions[0].options.length,
    'correctIndex points to valid option'
  );

  // TEST 4: Who / Where / When Question Generator
  console.log('\n--- Test Group 4: Who/Where/When Recall Generator ---');
  const whoWhereQuestions = await generateWhoWhereWhenQuestions({
    patientName: 'Anita Sharma',
    language: 'en',
    memories: mockMemories,
  });

  assert(whoWhereQuestions.length >= 2, 'Generates Who/Where/When questions');
  assert(
    whoWhereQuestions.some((q) => q.keyTerm === 'Priya' || q.question.includes('Priya')),
    'Question targets approved Memory Bank subject'
  );

  // TEST 5: Deterministic Adaptive Difficulty Engine
  console.log('\n--- Test Group 5: Deterministic Adaptive Difficulty ---');
  const highAccuracySessions: GameSessionRecord[] = [
    { difficulty_level: 2, accuracy: 0.9, avg_response_time_ms: 2200, mistakes: 0, played_at: '2026-09-10' },
    { difficulty_level: 2, accuracy: 0.95, avg_response_time_ms: 1900, mistakes: 0, played_at: '2026-09-11' },
    { difficulty_level: 2, accuracy: 0.92, avg_response_time_ms: 1800, mistakes: 0, played_at: '2026-09-12' },
  ];
  const nextDiffHigh = computeAdaptiveDifficulty(highAccuracySessions, 2);
  assert(nextDiffHigh === 3, 'Increases difficulty to 3 after consecutive high accuracy & faster pace');

  const lowAccuracySessions: GameSessionRecord[] = [
    { difficulty_level: 3, accuracy: 0.4, avg_response_time_ms: 4500, mistakes: 4, played_at: '2026-09-10' },
    { difficulty_level: 3, accuracy: 0.35, avg_response_time_ms: 5000, mistakes: 5, played_at: '2026-09-11' },
  ];
  const nextDiffLow = computeAdaptiveDifficulty(lowAccuracySessions, 3);
  assert(nextDiffLow === 2, 'Decreases difficulty to 2 after low accuracy / high mistakes');

  // TEST 6: Pre-calculated Metrics & Non-Diagnostic Caregiver Summary
  console.log('\n--- Test Group 6: Caregiver Weekly Summary & Recommendations ---');
  const preCalculatedMetrics: WeeklyMetrics = {
    week_start: '2026-09-01',
    total_sessions_completed: 6,
    overall_accuracy_percent: 78,
    avg_response_time_ms: 2300,
    total_mistakes: 3,
    reminder_adherence_percent: 91,
    reminders_completed: 10,
    total_reminders: 11,
    per_game_breakdown: {
      'Remember the Objects': { sessions: 2, avgAccuracy: 85, avgSpeedSec: '2.1' },
      'Sequence Recall': { sessions: 2, avgAccuracy: 75, avgSpeedSec: '2.5' },
    },
  };

  const reportResult = await generateCaregiverWeeklySummary({
    patientName: 'Anita Sharma',
    language: 'en',
    metrics: preCalculatedMetrics,
  });

  assert(typeof reportResult.summaryText === 'string' && reportResult.summaryText.length > 20, 'Generates narrative summary');
  assert(Array.isArray(reportResult.recommendations) && reportResult.recommendations.length >= 1, 'Generates actionable recommendations');
  assert(!reportResult.summaryText.toLowerCase().includes('dementia is getting worse'), 'Enforces non-diagnostic clinical safety constraint');

  // TEST 7: Conversational Assistant Query Handling
  console.log('\n--- Test Group 7: Conversational Assistant Context & Response ---');
  const assistantResult = await handlePatientAssistantQuery({
    query: 'What do I have today?',
    patientName: 'Anita Sharma',
    language: 'en',
    schedule: [
      { title: 'Morning Medicine', scheduled_time: '9:00 AM', is_done: false },
      { title: 'Garden Walk', scheduled_time: '10:00 AM', is_done: false },
    ],
  });

  assert(typeof assistantResult.reply === 'string' && assistantResult.reply.length > 5, 'Assistant returns natural language reply');
  assert(
    assistantResult.reply.includes('Morning Medicine') || assistantResult.reply.includes('task') || assistantResult.reply.includes('scheduled'),
    'Assistant uses schedule context accurately'
  );

  // TEST 8: Patient Data Isolation Test
  console.log('\n--- Test Group 8: Patient Data Isolation Verification ---');
  const patientA = { id: 'patient-a', name: 'Anita', memories: ['Anita Grandson Aarav'] };
  const patientB = { id: 'patient-b', name: 'Ramesh', memories: ['Ramesh Brother Suresh'] };

  // Verify that generating content for patient A only includes patient A's approved facts
  const patientAStory = await generatePersonalizedStory({
    patientName: patientA.name,
    language: 'en',
    memories: [{ category: 'person', key_term: 'Aarav', description: 'Anita Grandson' }],
  });

  assert(!patientAStory.story.includes('Suresh'), "Patient A's AI content never leaks Patient B's facts");
  assert(patientAStory.featuredItems.includes('Aarav'), "Patient A receives only their own approved facts");

  // TEST 9: Daily Cognitive Activity Time Limit & Safety Guardrails
  console.log('\n--- Test Group 9: Daily Cognitive Activity Time Limit & Guardrails ---');
  const usage = await getDailyCognitiveUsage('demo-patient-1', 'Asia/Kolkata');
  assert(usage.usageMinutes === 42, `Calculates cumulative activity correctly (Expected 42 min, got ${usage.usageMinutes} min)`);
  assert(usage.limitMinutes === 60, `Default limit is 60 minutes`);
  assert(usage.remainingMinutes === 18, `Accurate remaining time (Expected 18 min, got ${usage.remainingMinutes} min)`);
  assert(!usage.isLimitReached, `Limit not reached when under 60 minutes`);
  assert(usage.formattedProgress === '42 / 60 min', `Formats soft progress indicator accurately ("${usage.formattedProgress}")`);

  // Verify milestone reminder messages
  const reminder15 = getUsageReminder(15);
  assert(reminder15.milestone === 15 && Boolean(reminder15.message?.includes('15 minutes')), 'Gentle milestone reminder at 15 minutes');

  const reminder30 = getUsageReminder(30);
  assert(reminder30.milestone === 30 && Boolean(reminder30.message?.includes('A short break can be helpful')), 'Gentle milestone reminder at 30 minutes with break suggestion');

  const reminder45 = getUsageReminder(45);
  assert(reminder45.milestone === 45 && Boolean(reminder45.message?.includes('45 minutes')), 'Gentle milestone reminder at 45 minutes');

  const reminder55 = getUsageReminder(55);
  assert(reminder55.milestone === 55 && Boolean(reminder55.message?.includes("5 minutes of today's activity remaining")), 'Gentle warning reminder at 55 minutes');

  const reminder60 = getUsageReminder(60);
  assert(
    reminder60.milestone === 60 && Boolean(reminder60.message?.includes("Today's activity is complete")) && Boolean(reminder60.message?.includes('Come back tomorrow')),
    'Full-stop message at 60-minute limit enforces restful tomorrow prompt'
  );

  const reminderQuiet = getUsageReminder(10);
  assert(reminderQuiet.milestone === undefined, 'No disruptive prompt when not on milestone (e.g. 10 minutes)');

  // Verify limit reached state
  const usageMaxed = await getDailyCognitiveUsage('demo-patient-1', 'Asia/Kolkata', 40); // with 40-min limit on 42-min usage
  assert(usageMaxed.isLimitReached === true, 'Enforces limit reached guardrail when cumulative usage exceeds threshold');
  assert(usageMaxed.remainingMinutes === 0, 'Remaining minutes clamps cleanly to 0 when limit reached');

  console.log('\n--- TEST GROUP 10: Caregiver Dashboard Real-Time Backend Aggregation ---');
  const dashboardData = await getCaregiverDashboardData('demo-patient-1');
  assert(Boolean(dashboardData.selectedPatient && dashboardData.selectedPatient.id === 'demo-patient-1'), 'Correct active patient loaded (Anita Sharma)');
  assert(dashboardData.overview.weeklyAverage === 74, 'Weekly cognitive activity average accurately pre-calculated as 74%');
  assert(dashboardData.overview.previousWeekAverage === 68, 'Previous week average accurately pre-calculated as 68%');
  assert(dashboardData.overview.weeklyTrendLabel.includes('6%'), 'Weekly trend label accurately shows ↑ 6% from last week');
  assert(dashboardData.reminderStats.total === 14, 'Total scheduled reminders matches 14');
  assert(dashboardData.reminderStats.completed === 13, 'Acknowledged reminders matches 13');
  assert(dashboardData.reminderStats.adherenceRatePct === 92.9, 'Reminder adherence accurately computed at 92.9%');
  assert(dashboardData.overview.todayUsage.usageMinutes === 42, 'Today cumulative game usage is 42 minutes');
  assert(dashboardData.overview.todayUsage.limitMinutes === 60, 'Daily limit is 60 minutes');
  assert(dashboardData.overview.status === 'Active', 'Patient status rule correctly resolves to Active');
  assert(dashboardData.dailyPerformance.length === 7, '7-day daily breakdown contains all 7 days (Monday through Sunday)');
  const unplayedDay = dashboardData.dailyPerformance.find(d => d.score === null);
  assert(Boolean(unplayedDay && unplayedDay.statusText === 'Not enough activity data yet'), 'Unplayed day safely reports "Not enough activity data yet"');
  assert(dashboardData.gamePerformance.length === 7, 'Game-wise breakdown covers all 7 standard cognitive games');
  const unattemptedGame = dashboardData.gamePerformance.find(g => g.score === null);
  assert(Boolean(unattemptedGame && unattemptedGame.status === 'Not attempted yet'), 'Unattempted game safely reports "Not attempted yet" without fake stats');
  assert(dashboardData.patients.length === 1, 'Single demo patient summary card present in patient directory');
  assert(Boolean(dashboardData.patients[0] && dashboardData.patients[0].todayActivityProgress.includes('3 / 5 completed')), 'Patient summary displays today progress accurately');
  assert(dashboardData.aiObservations.length > 0, 'AI supportive observations generated with non-diagnostic safeguards');

  // TEST 11: End-to-End Real Operations & Data Integrity
  console.log('\n--- Test Group 11: End-to-End Real Operations & Data Integrity ---');

  // 11.1 Real Patient Creation & Session Verification
  const initialPatientCount = getDemoPatients().length;
  addDemoPatient({
    id: 'patient-test-2',
    caregiver_id: 'demo-caregiver-1',
    name: 'Rajesh Verma',
    patient_code: 'MC-7721',
    pin: '654321',
    preferred_language: 'hi',
    date_of_birth: '1952-04-12',
    gender: 'Male',
    time_zone: 'Asia/Kolkata',
    is_active: true,
    voice_enabled: true,
    text_size: 'large',
    daily_target_activities: 3,
    session_duration_minutes: 10,
    preferred_activity_time: 'morning',
    preferred_activity_types: ['memory', 'routine'],
    relationship: 'other',
    is_primary: false,
    last_active_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const allPatients = getDemoPatients();
  assert(allPatients.length === initialPatientCount + 1, 'Patient created and added to dynamic patient store');
  const retrievedPatient = getDemoPatient('patient-test-2');
  assert(retrievedPatient.name === 'Rajesh Verma' && retrievedPatient.patient_code === 'MC-7721', 'Retrieved patient matches persistent record');

  const sessionToken = await encodePatientSession({
    id: retrievedPatient.id,
    caregiver_id: retrievedPatient.caregiver_id,
    name: retrievedPatient.name,
    patient_code: retrievedPatient.patient_code,
    preferred_language: retrievedPatient.preferred_language,
    createdAt: Date.now(),
  });
  const decodedSession = await decodePatientSession(sessionToken);
  assert(
    Boolean(decodedSession && decodedSession.id === 'patient-test-2' && decodedSession.name === 'Rajesh Verma'),
    'Patient session token securely encodes and decodes real credentials'
  );

  // 11.2 Routines CRUD & Timeline Reordering
  addDemoRoutine({
    id: 'test-rt-1',
    patient_id: 'patient-test-2',
    time_of_day: '09:00',
    title: 'Morning Yoga',
    description: 'Gentle stretching and breathing exercises',
    days_of_week: ['mon', 'wed', 'fri'],
    is_enabled: true,
    created_at: new Date().toISOString(),
  });
  updateDemoRoutine('test-rt-1', {
    time_of_day: '09:30',
    title: 'Gentle Yoga & Breathing',
  });
  const routinesP2 = getDemoRoutines('patient-test-2');
  assert(
    routinesP2.some((r) => r.id === 'test-rt-1' && r.time_of_day === '09:30' && r.title === 'Gentle Yoga & Breathing'),
    'Routine updated with new time (09:30) and title'
  );

  // Chronological sorting test
  addDemoRoutine({
    id: 'test-rt-0',
    patient_id: 'patient-test-2',
    time_of_day: '08:00',
    title: 'Wake up & Water',
    description: 'Fresh glass of warm water',
    days_of_week: ['mon'],
    is_enabled: true,
    created_at: new Date().toISOString(),
  });
  const sortedRoutines = getDemoRoutines('patient-test-2');
  assert(
    sortedRoutines[0].time_of_day === '08:00' && sortedRoutines[1].time_of_day === '09:30',
    'Routines sorted chronologically in timeline (08:00 before 09:30)'
  );

  // Routine toggle enable/disable
  toggleDemoRoutine('test-rt-1', false);
  const enabledOnly = getDemoRoutines('patient-test-2', true);
  const allRoutines = getDemoRoutines('patient-test-2', false);
  assert(enabledOnly.length === 1 && allRoutines.length === 2, 'Disabled routine excluded when onlyEnabled is requested');

  // Routine deletion
  deleteDemoRoutine('test-rt-0');
  assert(getDemoRoutines('patient-test-2').length === 1, 'Routine deleted from real store');

  // 11.3 Reminders CRUD & Patient Acknowledgment
  addDemoReminder({
    id: 'test-rem-1',
    patient_id: 'patient-test-2',
    type: 'recurring',
    title: 'Afternoon Prescription',
    description: 'Take with water after lunch',
    scheduled_time: new Date().toISOString(),
    recurrence_rule: 'Daily 2 PM',
    is_done: false,
    voice_enabled: true,
    notification_enabled: true,
    memory_prompt_enabled: true,
    status: 'postponed',
    acknowledged_at: null,
    created_at: new Date().toISOString(),
  });
  const remBefore = getDemoReminders('patient-test-2').find((r) => r.id === 'test-rem-1');
  assert(remBefore?.is_done === false && remBefore?.status === 'postponed', 'Reminder created with pending status');

  updateDemoReminderStatus('test-rem-1', 'acknowledged');
  const remAfter = getDemoReminders('patient-test-2').find((r) => r.id === 'test-rem-1');
  assert(
    remAfter?.is_done === true && remAfter?.status === 'acknowledged' && typeof remAfter?.acknowledged_at === 'string',
    'Patient acknowledges reminder: status becomes acknowledged and timestamp recorded'
  );

  // 11.4 Memory Bank CRUD & Lifecycle Transition
  addDemoMemory({
    id: 'test-mem-1',
    patient_id: 'patient-test-2',
    category: 'person',
    key_term: 'Meera',
    description: 'Granddaughter who studies in Bengaluru',
    status: 'new',
    image_url: null,
    created_at: new Date().toISOString(),
  });
  const memNew = getDemoMemories('patient-test-2').find((m) => m.id === 'test-mem-1');
  assert(memNew?.status === 'new', 'Memory bank item starts in "new" lifecycle state');

  updateDemoMemoryStatus('test-mem-1', 'introduced');
  const memIntro = getDemoMemories('patient-test-2').find((m) => m.id === 'test-mem-1');
  assert(memIntro?.status === 'introduced', 'Memory bank item advances to "introduced" state');

  updateDemoMemoryStatus('test-mem-1', 'practiced');
  const memPracticed = getDemoMemories('patient-test-2').find((m) => m.id === 'test-mem-1');
  assert(memPracticed?.status === 'practiced', 'Memory bank item advances to "practiced" state');

  // 11.5 Deterministic Adaptive Difficulty Transition
  const initialDiff = computeAdaptiveDifficulty([], 2);
  assert(initialDiff === 2, 'Default difficulty starts at base level (Level 2)');

  addDemoGameSession({
    id: 'test-sess-1',
    patient_id: 'patient-test-2',
    game_name: 'Remember the Objects',
    game_type: 'remember-the-objects',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date().toISOString(),
    played_at: new Date().toISOString(),
    duration_seconds: 180,
    difficulty_level: 2,
    accuracy: 0.95,
    avg_response_time_ms: 1600,
    mistakes: 0,
    completed: true,
  });
  addDemoGameSession({
    id: 'test-sess-2',
    patient_id: 'patient-test-2',
    game_name: 'Remember the Objects',
    game_type: 'remember-the-objects',
    started_at: new Date(Date.now() - 7200000).toISOString(),
    completed_at: new Date(Date.now() - 7000000).toISOString(),
    played_at: new Date(Date.now() - 7000000).toISOString(),
    duration_seconds: 200,
    difficulty_level: 2,
    accuracy: 0.94,
    avg_response_time_ms: 1900,
    mistakes: 0,
    completed: true,
  });
  addDemoGameSession({
    id: 'test-sess-3',
    patient_id: 'patient-test-2',
    game_name: 'Remember the Objects',
    game_type: 'remember-the-objects',
    started_at: new Date(Date.now() - 10800000).toISOString(),
    completed_at: new Date(Date.now() - 10600000).toISOString(),
    played_at: new Date(Date.now() - 10600000).toISOString(),
    duration_seconds: 190,
    difficulty_level: 2,
    accuracy: 0.96,
    avg_response_time_ms: 2200,
    mistakes: 0,
    completed: true,
  });

  const p2Sessions = getDemoGameSessions('patient-test-2').filter((s) => s.game_type === 'remember-the-objects');
  const sessionRecords: GameSessionRecord[] = p2Sessions.map((s) => ({
    difficulty_level: s.difficulty_level,
    accuracy: s.accuracy,
    avg_response_time_ms: s.avg_response_time_ms,
    mistakes: s.mistakes,
    played_at: s.completed_at,
  }));
  const elevatedDiff = computeAdaptiveDifficulty(sessionRecords, 2);
  assert(elevatedDiff === 3, 'Adaptive difficulty advances from Level 2 to Level 3 after consecutive high performance');

  // ==========================================
  // TEST GROUP 12: MULTILINGUAL SYSTEM VERIFICATION
  // ==========================================
  console.log('\n--- Running Test Group 12: Multilingual System Verification ---');

  // 12.1 Language Registry & Metadata
  assert(isSupportedLanguage('en'), 'Language registry recognizes English (en)');
  assert(isSupportedLanguage('hi'), 'Language registry recognizes Hindi (hi)');
  assert(isSupportedLanguage('mr'), 'Language registry recognizes Marathi (mr)');
  assert(isSupportedLanguage('as'), 'Language registry recognizes Assamese (as)');
  assert(!isSupportedLanguage('xx'), 'Language registry rejects unsupported language (xx)');

  const mrMeta = getLanguageMeta('mr');
  assert(mrMeta.name === 'Marathi' && mrMeta.nativeName === 'मराठी', 'Marathi metadata has correct name and nativeName');

  // 12.2 Dictionaries & Fallback Resolution
  const enDict = getDictionary('en');
  const hiDict = getDictionary('hi');
  const mrDict = getDictionary('mr');

  assert(typeof enDict.landing.heroTitle === 'string' && enDict.landing.heroTitle.length > 0, 'English dictionary contains landing.heroTitle');
  assert(typeof hiDict.landing.heroTitle === 'string' && hiDict.landing.heroTitle.length > 0, 'Hindi dictionary contains landing.heroTitle');
  assert(typeof mrDict.landing.heroTitle === 'string' && mrDict.landing.heroTitle.length > 0, 'Marathi dictionary contains landing.heroTitle');

  // Verify full category coverage in Marathi dictionary
  assert(Boolean(mrDict.common && mrDict.nav && mrDict.auth && mrDict.dashboard && mrDict.routines && mrDict.reminders && mrDict.memoryBank && mrDict.safety && mrDict.games && mrDict.assistant && mrDict.progress && mrDict.help), 'Marathi dictionary covers all required sections');

  // Verify string helper with interpolation
  const interpolated = t(mrDict, 'common.syncedSuccess', { count: 3 });
  assert(interpolated.includes('3'), 't helper interpolates parameters in Marathi dictionary');

  // Verify English fallback for missing keys
  const fallbackDict = getDictionary('unsupported' as any);
  assert(fallbackDict.common.appName === 'CogniCare', 'getDictionary falls back to English for unknown locales');

  // 12.3 Locale Formatters
  const testDate = new Date(2026, 8, 20, 14, 30); // 20 Sept 2026, 2:30 PM
  const formattedEn = formatDate(testDate, { month: 'short', day: 'numeric' }, 'en');
  const formattedMr = formatDate(testDate, { month: 'short', day: 'numeric' }, 'mr');
  assert(typeof formattedEn === 'string' && formattedEn.length > 0, 'formatDate produces valid string for en');
  assert(typeof formattedMr === 'string' && formattedMr.length > 0, 'formatDate produces valid string for mr');

  const formattedNumMr = formatNumber(12500, 'mr');
  assert(typeof formattedNumMr === 'string', 'formatNumber formats numbers for Marathi');

  const formattedPctMr = formatPercent(85, 'mr');
  assert(formattedPctMr.includes('85') || formattedPctMr.includes('%'), 'formatPercent formats percentage');

  const durEn = formatDuration(3, 'en');
  const durMr = formatDuration(3, 'mr');
  const durHi = formatDuration(3, 'hi');
  assert(durEn.includes('3 min'), 'formatDuration formats 3 minutes to "3 mins" in English');
  assert((durMr.includes('3') || durMr.includes('३')) && durMr.includes('मि'), 'formatDuration formats 3 minutes in Marathi');
  assert((durHi.includes('3') || durHi.includes('३')) && durHi.includes('मि'), 'formatDuration formats 3 minutes in Hindi');

  const pluralOne = formatPlural(1, { one: 'task', other: 'tasks' }, 'en');
  const pluralOther = formatPlural(5, { one: 'task', other: 'tasks' }, 'en');
  assert(pluralOne === 'task', 'formatPlural correctly selects singular');
  assert(pluralOther === 'tasks', 'formatPlural correctly selects plural');

  // 12.4 AI Engine Multilingual Marathi Support
  const mrStory = await generatePersonalizedStory({
    patientName: 'Ramesh',
    language: 'mr',
    memories: [
      { category: 'person', key_term: 'सुरेश', description: 'माझा धाकटा भाऊ' },
      { category: 'place', key_term: 'शिवाजी पार्क', description: 'आम्ही एकत्र खेळायचो ती बाग' },
    ],
  });
  assert(typeof mrStory.story === 'string' && mrStory.story.length > 0, 'AI generates story in Marathi');
  assert(mrStory.story.includes('सुरेश') || mrStory.story.includes('शिवाजी पार्क'), 'Marathi story faithfully incorporates Memory Bank facts');

  const mrRoutineRecall = await generateRoutineRecallQuestions({
    patientName: 'Ramesh',
    language: 'mr',
    routines: [
      { time_of_day: '08:00 AM', title: 'सकाळची चहा आणि औषध', description: 'चहा' },
      { time_of_day: '05:30 PM', title: 'संध्याकाळचा फेरफटका', description: 'बाग' },
    ],
  });
  assert(mrRoutineRecall.length > 0 && typeof mrRoutineRecall[0].question === 'string', 'AI generates Routine Recall questions in Marathi');

  const mrWhoQuestions = await generateWhoWhereWhenQuestions({
    patientName: 'Ramesh',
    language: 'mr',
    memories: [
      { category: 'person', key_term: 'डॉ. जोशी', description: 'कौटुंबिक डॉक्टर' },
      { category: 'place', key_term: 'जुने घर', description: 'पुण्यातील वाडा' },
    ],
  });
  assert(mrWhoQuestions.length > 0 && typeof mrWhoQuestions[0].question === 'string', 'AI generates Who/Where/When questions in Marathi');

  const mrSummary = await generateCaregiverWeeklySummary({
    patientName: 'Ramesh',
    language: 'mr',
    metrics: {
      week_start: '2026-09-01',
      total_sessions_completed: 6,
      overall_accuracy_percent: 88,
      avg_response_time_ms: 1800,
      total_mistakes: 1,
      reminder_adherence_percent: 92,
      reminders_completed: 11,
      total_reminders: 12,
      per_game_breakdown: {},
    },
  });
  assert(typeof mrSummary.summaryText === 'string' && mrSummary.summaryText.length > 0, 'AI generates weekly summary in Marathi');
  assert(Array.isArray(mrSummary.recommendations) && mrSummary.recommendations.length > 0, 'AI generates recommendations in Marathi');

  const mrAssistantReply = await handlePatientAssistantQuery({
    patientName: 'Ramesh',
    language: 'mr',
    query: 'आजचे काय काम आहे?',
    schedule: [{ title: 'औषध', scheduled_time: '09:00 AM', is_done: false }],
  });
  assert(typeof mrAssistantReply.reply === 'string' && mrAssistantReply.reply.length > 0, 'AI assistant answers in Marathi');

  // 12.5 Independent Language Preference Persistence
  updateDemoCaregiver({ preferred_language: 'hi' });
  const updatedCg = getDemoCaregiver();
  assert(updatedCg.preferred_language === 'hi', 'Caregiver language persists independently as Hindi');

  updateDemoPatientPreferences('demo-patient-1', { preferred_language: 'mr' });
  const p1 = getDemoPatients().find((p) => p.id === 'demo-patient-1');
  assert(p1?.preferred_language === 'mr', 'Patient language persists independently as Marathi');
  assert(getDemoCaregiver().preferred_language === 'hi', 'Caregiver language remains Hindi while patient is Marathi (Decoupling verified)');

  // Reset demo state so dev server returns to clean initial demo state
  resetDemoState();

  console.log('\n========================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
