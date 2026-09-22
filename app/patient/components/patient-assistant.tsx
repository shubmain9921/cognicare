'use client';

import { useState, useTransition } from 'react';
import { askPatientAssistant } from '@/app/actions/assistant';
import { useI18n } from '@/lib/i18n/context';

export default function PatientAssistant({ patientName = 'Friend' }: { patientName?: string }) {
  const { locale } = useI18n();
  const lang = locale;
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text:
        lang === 'hi'
          ? `नमस्ते ${patientName}! मैं आपकी दिनचर्या और यादों में मदद के लिए यहाँ हूँ। आप मुझसे क्या पूछना चाहते हैं?`
          : lang === 'as'
          ? `নমস্কাৰ ${patientName}! মই আপোনাৰ দৈনিক কাৰ্যসূচী আৰু স্মৃতিত সহায় কৰিবলৈ ইয়াত আছোঁ।`
          : `Hello ${patientName}! I'm here to help you remember your day, medicine, and routine. How can I help you?`,
    },
  ]);
  const [isPending, startTransition] = useTransition();

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isPending) return;

    setInputQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);

    startTransition(async () => {
      try {
        const res = await askPatientAssistant(query);
        setMessages((prev) => [...prev, { sender: 'assistant', text: res.reply }]);

        // Speak aloud if browser supports SpeechSynthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(res.reply);
          if (lang === 'hi') utterance.lang = 'hi-IN';
          else if (lang === 'as') utterance.lang = 'as-IN';
          else utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text:
              lang === 'hi'
                ? 'माफ़ कीजिये, मैं अभी जवाब नहीं दे सका। कृपया थोड़ी देर बाद प्रयास करें।'
                : 'I am having trouble answering right now. Please check with your caregiver.',
          },
        ]);
      }
    });
  };

  const quickPrompts =
    lang === 'hi'
      ? ['आज मेरा क्या कार्यक्रम है?', 'मेरी दवा का समय क्या है?', 'मेरी दिनचर्या क्या है?']
      : lang === 'as'
      ? ['আজি মোৰ কি সূচী আছে?', 'ঔষধৰ সময় কেতিয়া?', 'মোৰ নিয়মীয়া কাৰ্যসূচী কি?']
      : ['What do I have today?', 'When is my medicine?', 'What is my daily routine?'];

  return (
    <div className="w-full">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full py-4 px-6 bg-amber-100 hover:bg-amber-200 border-4 border-black rounded-3xl shadow-md transition flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="text-3xl">🎙️</span>
            <div>
              <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                {lang === 'hi' ? 'स्मार्ट सहायक से पूछें' : lang === 'as' ? 'সহায়কক সোধক' : 'Ask MemoryCare Assistant'}
              </p>
              <p className="text-sm font-bold text-gray-700">
                {lang === 'hi' ? 'दवा, समय या दिनचर्या के बारे में जानें' : 'Check medicine, routine, or your schedule'}
              </p>
            </div>
          </div>
          <span className="text-2xl font-black group-hover:translate-x-1 transition text-amber-900">➔</span>
        </button>
      ) : (
        <div className="bg-white border-4 border-black rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <h3 className="text-xl font-black text-gray-900">
                {lang === 'hi' ? 'स्मार्ट सहायक' : lang === 'as' ? 'সহায়ক' : 'MemoryCare Assistant'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 px-3 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-bold text-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Messages list */}
          <div className="space-y-3 max-h-60 overflow-y-auto p-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl border-2 border-black text-base sm:text-lg font-bold ${
                    m.sender === 'user'
                      ? 'bg-emerald-100 text-emerald-950 rounded-br-none'
                      : 'bg-amber-50 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="p-3 bg-gray-100 border-2 border-gray-300 rounded-2xl text-sm font-bold text-gray-600 animate-pulse">
                  Thinking... 💭
                </div>
              </div>
            )}
          </div>

          {/* Quick tap chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isPending}
                className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 rounded-xl text-xs sm:text-sm font-extrabold text-emerald-900 transition active:scale-95 disabled:opacity-50"
              >
                💬 {prompt}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'यहाँ सवाल पूछें...' : 'Ask a question here...'}
              disabled={isPending}
              className="flex-1 px-4 py-3 border-3 border-black rounded-2xl font-bold text-base text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-300 bg-white"
            />
            <button
              type="submit"
              disabled={isPending || !inputQuery.trim()}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl border-3 border-black transition active:scale-95"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
