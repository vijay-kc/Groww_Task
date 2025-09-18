'use client';

import { useState } from 'react';
import { useDashboard } from '@/store/dashboard-store';
import { DashboardHeader } from './DashboardHeader';
import { WidgetGrid } from './WidgetGrid';
import { AddWidgetModal } from './modals/AddWidgetModal';
import { ConfigurationPanel } from './panels/ConfigurationPanel';
import { ImportExportPanel } from './panels/ImportExportPanel';

export function Dashboard() {
  const { widgets, isEditMode, selectedWidget } = useDashboard();
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        onAddWidget={() => setShowAddWidget(true)}
        onImportExport={() => setShowImportExport(true)}
      />
      
      <main className="container mx-auto px-4 py-6">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 max-w-lg">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Build Your Finance Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Start by adding your first widget to monitor real-time financial data, 
                track your watchlist, and visualize market trends.
              </p>
              <button
                onClick={() => setShowAddWidget(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Add Your First Widget
              </button>
            </div>
          </div>
        ) : (
          <WidgetGrid />
        )}
      </main>

      {showAddWidget && (
        <AddWidgetModal onClose={() => setShowAddWidget(false)} />
      )}

      {selectedWidget && !isEditMode && (
        <ConfigurationPanel />
      )}

      {showImportExport && (
        <ImportExportPanel onClose={() => setShowImportExport(false)} />
      )}
    </div>
  );
}