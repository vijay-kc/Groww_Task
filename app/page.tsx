'use client';

import { Dashboard } from '@/components/Dashboard';
import { DashboardProvider } from '@/store/dashboard-store';

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}