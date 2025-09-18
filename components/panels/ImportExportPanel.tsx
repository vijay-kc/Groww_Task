'use client';

import { useState } from 'react';
import { useDashboard } from '@/store/dashboard-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, Copy, Check } from 'lucide-react';

interface ImportExportPanelProps {
  onClose: () => void;
}

export function ImportExportPanel({ onClose }: ImportExportPanelProps) {
  const { exportDashboard, importDashboard } = useDashboard();
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const config = exportDashboard();
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      importDashboard(importData);
      onClose();
    } catch (error) {
      alert('Invalid dashboard configuration');
    }
  };

  const downloadConfig = () => {
    const config = exportDashboard();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import/Export Dashboard</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export your current dashboard configuration to share or backup.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                  {exportDashboard()}
                </pre>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleExport} className="flex-1">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button onClick={downloadConfig} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import a dashboard configuration to restore your widgets and layout.
              </p>
              
              <Textarea
                placeholder="Paste your dashboard configuration here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importData.trim()} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import Dashboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}