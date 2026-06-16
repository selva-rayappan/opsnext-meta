import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | OpsNext CRM',
    default: 'Sign in',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-card-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 text-white"
            aria-hidden="true"
          >
            <path
              d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xl font-semibold tracking-tight text-slate-800">
          OpsNext CRM
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-card-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} OpsNext. All rights reserved.
      </p>
    </div>
  );
}
