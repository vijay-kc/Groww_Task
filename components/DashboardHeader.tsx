'use client';

import { useDashboard } from '@/store/dashboard-store';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Edit3,
  Save,
  Download,
  RotateCcw,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  onAddWidget: () => void;
  onImportExport: () => void;
}

export function DashboardHeader({ onAddWidget, onImportExport }: DashboardHeaderProps) {
  const { isEditMode, setEditMode, clearCache, widgets } = useDashboard();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      // Optional: respect system preference if no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Finance Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {widgets.length} widget{widgets.length !== 1 ? 's' : ''} configured
                </p>
              </div>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>

              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCache}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refresh All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear cache & reload all widgets</p>
                </TooltipContent>
              </Tooltip> */}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onImportExport}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import/Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import or export dashboard layout</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditMode(!isEditMode)}
                    className={isEditMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {isEditMode ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                    {isEditMode ? 'Save Layout' : 'Edit Layout'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditMode ? "Save your widget layout" : "Enable edit mode to rearrange widgets"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onAddWidget} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new widget to the dashboard</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
