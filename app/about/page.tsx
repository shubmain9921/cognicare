import Link from 'next/link';

export const metadata = {
  title: 'About CogniCare — Cognitive Support Platform',
  description: 'Learn how CogniCare helps families support loved ones with memory and cognitive challenges through personalised training, reminders, and AI-powered insights.',
};

const PILLARS = [
  {
    id: 'train',
    emoji: '🧠',
    title: 'Train',
    color: 'bg-emerald-50 border-emerald-500',
    badgeColor: 'bg-emerald-600',
    heading: 'Adaptive Cognitive Games',
    points: [
      '7 science-backed memory games — from object recall to personalised story quizzes',
      'Difficulty automatically adapts each session based on past performance',
      'Core games work offline — patients can play without an internet connection',
    ],
  },
  {
    id: 'remember',
    emoji: '📔',
    title: 'Remember',
    color: 'bg-amber-50 border-amber-500',
    badgeColor: 'bg-amber-500',
    heading: 'Personalised Memory Bank',
    points: [
      'Caregivers log the people, places, and routines that matter to the patient',
      'Memory bank entries power the 3 personalised games (Story Recall, Daily Routine, Who/Where/When)',
      'Google Gemini generates game stories and quizzes directly in the patient\'s preferred language',
    ],
  },
  {
    id: 'assist',
    emoji: '🔔',
    title: 'Assist',
    color: 'bg-blue-50 border-blue-500',
    badgeColor: 'bg-blue-600',
    heading: 'Daily Reminders & Caregiver Dashboard',
    points: [
      'Caregiver schedules medication, meals, walks, and appointments as reminders',
      'Patient sees a large-font, high-contrast schedule optimised for elderly users',
      'Dashboard shows accuracy trends, session frequency, and per-game breakdown charts',
    ],
  },
  {
    id: 'connect',
    emoji: '🤝',
    title: 'Connect',
    color: 'bg-rose-50 border-rose-500',
    badgeColor: 'bg-rose-600',
    heading: 'Caregiver ↔ Patient Link & AI Reports',
    points: [
      'Patients log in with a Patient ID + Passcode — no tech literacy required',
      'Every patient is securely linked to their authorized caregiver accounts',
      'Weekly AI-generated observational reports summarise cognitive progress and adherence',
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-amber-50/30 text-gray-900">
      {/* Nav */}
      <nav className="bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-2xl text-black">
          <span className="text-3xl">🧠</span> CogniCare
        </Link>
        <div className="flex gap-3">
          <Link href="/caregiver/login" className="py-2 px-5 bg-gray-900 text-white font-bold text-base rounded-xl border-2 border-black hover:bg-black transition">
            Caregiver Login
          </Link>
          <Link href="/patient/login" className="py-2 px-5 bg-emerald-600 text-white font-bold text-base rounded-xl border-2 border-black hover:bg-emerald-700 transition">
            Patient Access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-block bg-black text-white text-sm font-extrabold px-4 py-1.5 rounded-full tracking-widest uppercase mb-2">
          Smart India Hackathon 2026
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-black tracking-tight leading-tight">
          Memory care that feels<br />
          <span className="text-emerald-600">human.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 font-semibold max-w-2xl mx-auto leading-relaxed">
          CogniCare helps families support loved ones with dementia and memory challenges
          through personalised cognitive training, gentle reminders, and AI-powered observational insights.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link href="/caregiver/signup" className="py-4 px-8 bg-black text-white font-extrabold text-xl rounded-2xl border-2 border-black hover:bg-gray-900 transition shadow-md">
            Get Started Free →
          </Link>
          <Link href="/patient/login" className="py-4 px-8 bg-emerald-600 text-white font-extrabold text-xl rounded-2xl border-2 border-black hover:bg-emerald-700 transition shadow-md">
            Patient Access
          </Link>
        </div>
      </section>

      {/* 4 Pillars */}
      <section className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-8">
          Four Pillars of CogniCare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((p) => (
            <div key={p.id} className={`border-4 ${p.color} rounded-3xl p-8 space-y-5 shadow-md`}>
              <div className="flex items-center gap-4">
                <span className="text-6xl">{p.emoji}</span>
                <div>
                  <span className={`${p.badgeColor} text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-widest`}>
                    {p.title}
                  </span>
                  <h3 className="text-2xl font-extrabold text-black mt-1">{p.heading}</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {p.points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3 text-lg font-semibold text-gray-800">
                    <span className="text-emerald-600 font-extrabold text-xl mt-0.5">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-black text-white py-12 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold">Built With</h2>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {['Next.js 14', 'Supabase', 'Google Gemini AI', 'IndexedDB (Offline PWA)', 'Recharts', 'Tailwind CSS', 'TypeScript'].map(t => (
              <span key={t} className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-base font-bold">
                {t}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-base font-semibold mt-4">
            Multilingual · PWA-ready · Adaptive difficulty · AI-generated observational reports
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm font-bold text-gray-500">
        CogniCare © 2026 · Built for Smart India Hackathon 2026
      </footer>
    </div>
  );
}
