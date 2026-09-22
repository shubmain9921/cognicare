# CogniCare (MemoryCare) 🧠

> **AI-Powered Multilingual Cognitive Gaming and Memory-Assistance Platform**  
> Designed for individuals living with dementia, Alzheimer's, or mild cognitive impairment, and their caregivers.

CogniCare is a connected, database-driven healthcare platform combining clinically-informed cognitive stimulation games, daily routine management, two-way reminder adherence tracking, and supportive AI assistance.

---

## 🌟 Key Features

### 1. 🎮 7 Clinically-Informed Cognitive Games
- **Visual Memory**: *Remember the Objects*
- **Working Memory**: *Sequence Recall*
- **Associative Memory**: *Find the Pair*
- **Visual Attention**: *What Changed?*
- **Verbal Memory**: *Story Recall* (AI-generated stories & questions)
- **Routine Memory**: *Daily Routine Recall* (Personalized schedule questions)
- **Orientation & Episodic Memory**: *Who / Where / When?* (Memory Bank grounded)
- **Adaptive Difficulty Engine**: Deterministically scales across Levels 1–5 based on recent accuracy, response speed, and error trends.

### 2. 🛡️ Patient Safety & Guardrails
- **Daily Cognitive Usage Limit**: Enforces a default 60-minute daily activity cap across all games.
- **Gentle Milestones**: Periodic non-intrusive reminders at 15, 30, 45, 55, and 60 minutes.
- **Dementia-Friendly UI**: High-contrast typography, large touch targets, simplified navigation, and voice-assisted interactions.

### 3. 🌐 Production Multilingual System (i18n)
- **Supported Languages**: English (en), Hindi (hi), Marathi (mr), and Assamese (s).
- **Caregiver & Patient Language Decoupling**: Caregivers can manage patients in Marathi/English while patients interact independently in Hindi/Marathi.
- **Indic Typography**: Native font support for Devanagari and Eastern Nagari scripts with zero text clipping.
- **Locale-Aware Formatting**: Full support for localized dates, times, numbers, percentages, and durations.

### 4. 👨‍⚕️ Real-Time Caregiver Dashboard
- **7-Day Breakdown**: Day-by-day analysis (Monday through Sunday) with session counts and accuracy scores.
- **Longitudinal Trend Tracking**: Week-over-week performance comparisons.
- **Two-Way Reminder Adherence**: Live adherence rate calculation based on patient acknowledgments and postponements.
- **Memory Bank Management**: Staged lifecycle progression (
ew → introduced → practiced → ecall_observed) ensuring factual integrity.
- **Non-Diagnostic AI Summaries**: Periodic observations and supportive care suggestions powered by Gemini.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **AI Engine**: Google Gemini API (@google/genai) with strict hallucination deflections and memory-grounded context
- **Database & Auth**: Supabase (PostgreSQL) + Edge-compatible Session Engine
- **Demo Mode**: Built-in persistent local store for offline exhibitions and rapid evaluation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm / yarn / pnpm

### Installation

1. **Clone the repository**:
   \\\ash
   git clone https://github.com/shubmain9921/cognicare.git
   cd cognicare
   \\\

2. **Install dependencies**:
   \\\ash
   npm install
   \\\

3. **Configure Environment Variables**:
   Copy .env.local.example to .env.local:
   \\\ash
   cp .env.local.example .env.local
   \\\
   Add your Gemini API Key and (optional) Supabase credentials:
   \\\env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \\\

4. **Run Development Server**:
   \\\ash
   npm run dev
   \\\
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run the Test Suite**:
   \\\ash
   npx tsx scripts/test-ai-engine.ts
   \\\

6. **Production Build**:
   \\\ash
   npm run build
   npm run start
   \\\

---

## 🔑 Demo Access (SIH 2026 Showcase)

To evaluate the system without setting up external database instances, use the built-in demo credentials:

| Role | Portal URL | Credentials |
| :--- | :--- | :--- |
| **Caregiver** | /caregiver/login | **Email**: demo@memorycare.app<br>**Password**: Demo@2026 |
| **Patient** | /patient/login | **Patient Code**: DEMO-001<br>**Passcode**: 202626 |

---

## 📄 License
This project is developed for cognitive care and healthcare innovation. All rights reserved.
