import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome to OpsNext CRM. Select a section from the sidebar to get
        started.
      </p>
    </div>
  );
}
