'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { caregiverSignUp } from '@/app/actions/auth';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition"
    >
      {pending ? 'Creating Account...' : 'Sign Up'}
    </button>
  );
}

export default function CaregiverSignUpPage() {
  const [state, formAction] = useFormState(caregiverSignUp, null);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 text-gray-900">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
        <div>
          <h1 className="text-xl font-bold">Caregiver Registration</h1>
          <p className="text-sm text-gray-600">Create an account to manage your patients</p>
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="caregiver@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="preferred_language">
              Preferred Language
            </label>
            <select
              id="preferred_language"
              name="preferred_language"
              defaultValue="en"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          </div>

          <SubmitButton />
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/caregiver/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
