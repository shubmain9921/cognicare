/**
 * CogniCare Demo Seed Script
 * Run: npx tsx scripts/seed-demo.ts
 *
 * Creates:
 *  - 1 demo caregiver  (demo@cognicare.health / Demo@2024)
 *  - 1 demo patient    (code: DEMO01 / PIN: 1234)
 *  - 8 memory_bank entries (people, places, routines)
 *  - 5 recurring reminders
 *  - ~30 game_sessions over 14 days
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('your-project')) {
  console.error('Set real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function randomBetween(min: number, max: number) { return Math.random() * (max - min) + min; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

async function main() {
  console.log('Starting CogniCare demo seed...\n');

  // 1. Caregiver
  const cgEmail = 'demo@cognicare.health';
  const cgHash = await bcrypt.hash('Demo@2024', 10);
  const { data: existing } = await supabase.from('caregivers').select('id').eq('email', cgEmail).single();
  if (existing) await supabase.from('caregivers').delete().eq('id', existing.id);

  const { data: cg, error: cgErr } = await supabase.from('caregivers')
    .insert({ name: 'Dr. Ananya Sharma', email: cgEmail, password_hash: cgHash, preferred_language: 'en' })
    .select('id').single();
  if (cgErr || !cg) { console.error('Caregiver failed:', cgErr?.message); process.exit(1); }
  console.log('Caregiver: demo@cognicare.health / Demo@2024');

  // 2. Patient
  const pinHash = await bcrypt.hash('1234', 10);
  await supabase.from('patients').delete().eq('patient_code', 'DEMO01');
  const { data: pt, error: ptErr } = await supabase.from('patients')
    .insert({ caregiver_id: cg.id, name: 'Ramesh Gupta', patient_code: 'DEMO01', pin_hash: pinHash, preferred_language: 'en' })
    .select('id').single();
  if (ptErr || !pt) { console.error('Patient failed:', ptErr?.message); process.exit(1); }
  console.log('Patient: Ramesh Gupta  DEMO01 / 1234');

  // 3. Memory bank
  const memories = [
    { category: 'person', key_term: 'Arjun', description: 'My son. Software engineer in Bangalore. Calls every Sunday.' },
    { category: 'person', key_term: 'Priya', description: 'My daughter. Lives nearby in Delhi. Brings sweets on festivals.' },
    { category: 'person', key_term: 'Dr. Mehta', description: 'My family doctor at Apollo Clinic, New Delhi.' },
    { category: 'person', key_term: 'Sunita', description: 'My wife. Makes rajma chawal every Sunday.' },
    { category: 'place', key_term: "Arjun's apartment", description: "Son's flat in Koramangala, Bangalore. 4th floor, blue door." },
    { category: 'place', key_term: 'Lodi Garden', description: 'The park for my morning walk. Near the south gate.' },
    { category: 'routine', key_term: 'Morning walk', description: 'Walk at Lodi Garden every day at 7 AM for 30 minutes.' },
    { category: 'routine', key_term: 'Evening medication', description: 'Take Amlodipine 5mg with a full glass of water at 7 PM.' },
  ];
  const { error: mErr } = await supabase.from('memory_bank').insert(memories.map(m => ({ ...m, patient_id: pt.id })));
  if (mErr) console.error('Memory bank failed:', mErr.message);
  else console.log(`${memories.length} memory entries created`);

  // 4. Reminders
  const today = new Date(); today.setSeconds(0, 0);
  const makeTime = (h: number, m = 0) => { const d = new Date(today); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const rems = [
    { type: 'recurring', title: 'Morning Walk — Lodi Garden', scheduled_time: makeTime(7), recurrence_rule: 'Daily', is_done: false },
    { type: 'recurring', title: 'Blood Pressure Tablet (Amlodipine)', scheduled_time: makeTime(8, 30), recurrence_rule: 'Daily', is_done: false },
    { type: 'recurring', title: 'Drink a glass of water', scheduled_time: makeTime(11), recurrence_rule: 'Daily', is_done: false },
    { type: 'recurring', title: 'Lunch', scheduled_time: makeTime(13), recurrence_rule: 'Daily', is_done: false },
    { type: 'recurring', title: 'Evening Medication — Amlodipine 5mg', scheduled_time: makeTime(19), recurrence_rule: 'Daily', is_done: false },
  ];
  const { error: rErr } = await supabase.from('reminders').insert(rems.map(r => ({ ...r, patient_id: pt.id })));
  if (rErr) console.error('Reminders failed:', rErr.message);
  else console.log(`${rems.length} reminders created`);

  // 5. Game sessions — 14 days of realistic improving data
  const { data: games } = await supabase.from('games').select('id, name');
  if (!games) { console.error('No games found'); process.exit(1); }
  const gMap: Record<string, string> = {};
  for (const g of games) gMap[g.name] = g.id;

  const gameNames = ['Remember the Objects','Sequence Recall','Find the Pair','What Changed?','Story Recall','Daily Routine Recall','Who/Where/When?'];
  const sessions: object[] = [];

  for (let day = 13; day >= 0; day--) {
    const count = 2 + (day % 3 === 0 ? 1 : 0);
    const shuffled = [...gameNames].sort(() => Math.random() - 0.5).slice(0, count);
    for (const name of shuffled) {
      const gid = gMap[name]; if (!gid) continue;
      const prog = (13 - day) / 13;
      const accuracy = clamp(0.50 + prog * 0.35 + randomBetween(-0.08, 0.08), 0.3, 1.0);
      const difficulty = Math.min(5, Math.max(1, Math.round(1 + prog * 2.5)));
      const responseMs = Math.max(800, Math.round(randomBetween(3500, 8000) - prog * 2000));
      sessions.push({ patient_id: pt.id, game_id: gid, difficulty_level: difficulty, accuracy: Math.round(accuracy * 100) / 100, avg_response_time_ms: responseMs, mistakes: Math.round((1 - accuracy) * 6), completed: true, played_at: daysAgo(day, 9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60)) });
    }
  }
  const { error: sErr } = await supabase.from('game_sessions').insert(sessions);
  if (sErr) console.error('Sessions failed:', sErr.message);
  else console.log(`${sessions.length} game sessions created (14 days)`);

  console.log('\nDone! Credentials:\n  CAREGIVER: demo@cognicare.health / Demo@2024\n  PATIENT:   DEMO01 / 1234\n');
}
main().catch(e => { console.error(e); process.exit(1); });
