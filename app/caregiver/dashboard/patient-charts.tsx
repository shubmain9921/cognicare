'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { DailyPerformancePoint, GameWisePerformanceItem } from '@/lib/caregiver-dashboard';

export interface ChartSessionData {
  id: string;
  gameName: string;
  accuracyPct: number; // 0 - 100
  avgResponseTimeMs: number;
  difficulty: number;
  playedAt: string;
  formattedDate: string;
}

export interface ReminderStatData {
  total: number;
  completed: number;
  adherenceRatePct: number;
}

const PIE_COLORS = ['#10B981', '#E5E7EB'];

export default function PatientCharts({
  patientName,
  sessions,
  reminderStats,
  dailyPerformance,
  gamePerformance,
}: {
  patientName: string;
  sessions: ChartSessionData[];
  reminderStats: ReminderStatData;
  dailyPerformance?: DailyPerformancePoint[];
  gamePerformance?: GameWisePerformanceItem[];
}) {
  // Aggregate sessions by game name
  const gameCountsMap: Record<string, number> = {};
  sessions.forEach((s) => {
    gameCountsMap[s.gameName] = (gameCountsMap[s.gameName] || 0) + 1;
  });

  const barChartData = Object.keys(gameCountsMap).map((name) => ({
    name,
    sessions: gameCountsMap[name],
  }));

  const pieData = [
    { name: 'Completed', value: reminderStats.completed },
    { name: 'Pending', value: Math.max(0, reminderStats.total - reminderStats.completed) },
  ];

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Cognitive Analytics & Adherence — {patientName}
        </h2>
        <p className="text-xs text-gray-500">
          Real-time performance trends pulled directly from game sessions and daily reminders.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg space-y-2">
          <span className="text-4xl block">📊</span>
          <p className="font-semibold text-gray-700">No game session history yet.</p>
          <p className="text-xs text-gray-400">
            Have {patientName} play brain activities to generate accuracy and response time trends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Accuracy Over Time */}
          <div className="lg:col-span-2 bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">
                Accuracy Over Time (%)
              </h3>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Last {sessions.length} Sessions
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessions} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="formattedDate" stroke="#6b7280" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartSessionData;
                        return (
                          <div className="bg-gray-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-bold text-emerald-400">{data.gameName}</p>
                            <p>Accuracy: <span className="font-bold">{data.accuracyPct}%</span></p>
                            <p>Speed: <span className="font-bold">{(data.avgResponseTimeMs / 1000).toFixed(1)}s</span></p>
                            <p>Level: <span className="font-bold">{data.difficulty}</span></p>
                            <p className="text-[10px] text-gray-400">{data.formattedDate}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracyPct"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6, fill: '#047857' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Reminder Adherence Gauge */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">
                Reminder Adherence
              </h3>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Daily Routine
              </span>
            </div>

            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-gray-900">
                  {reminderStats.adherenceRatePct}%
                </span>
                <span className="text-[10px] font-semibold text-gray-500 uppercase">
                  Adherence
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-gray-500">Completed</div>
                <div className="text-base font-bold text-emerald-600">
                  {reminderStats.completed}
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <div className="text-gray-500">Total Tasks</div>
                <div className="text-base font-bold text-gray-800">
                  {reminderStats.total}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Sessions Per Game Type */}
          <div className="lg:col-span-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">
              Sessions Per Game Type
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 4: 7-Day Daily Performance Breakdown */}
          {dailyPerformance && dailyPerformance.length > 0 && (
            <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    7-Day Daily Performance Breakdown
                  </h3>
                  <p className="text-xs text-gray-500">
                    Daily cognitive activity performance calculated dynamically from real completed sessions.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                  Current Week
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 pt-2">
                {dailyPerformance.map((day) => (
                  <div
                    key={day.dayName}
                    className={`p-3 rounded-xl border text-center space-y-1 transition ${
                      day.score !== null
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-gray-50/70 border-gray-200 text-gray-400'
                    }`}
                  >
                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      {day.dayName.slice(0, 3)}
                    </p>
                    {day.score !== null ? (
                      <>
                        <p className="text-xl font-bold text-gray-900">{day.score}%</p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          {day.sessions} {day.sessions === 1 ? 'session' : 'sessions'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-gray-400 py-1">—</p>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          Not enough activity data yet
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Game-Wise Performance (Standard 7 Games) */}
          {gamePerformance && gamePerformance.length > 0 && (
            <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Cognitive Activity Performance by Game
                  </h3>
                  <p className="text-xs text-gray-500">
                    Objective game-wise accuracy across standard activities. Unattempted games are clearly indicated.
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-semibold">
                  7 Core Activities
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {gamePerformance.map((g) => (
                  <div
                    key={g.name}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      g.score !== null
                        ? 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                        : 'bg-gray-50/60 border-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900">{g.name}</p>
                      <p className="text-[10px] text-gray-400">{g.category}</p>
                    </div>
                    <div>
                      {g.score !== null ? (
                        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                          {g.score}%
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md border border-gray-200">
                          Not attempted yet
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
