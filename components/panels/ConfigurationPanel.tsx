'use client';

import { useDashboard } from '@/store/dashboard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ApiField } from '@/services/api'; // Import the actual ApiField type

// Function to fetch available API fields dynamically
const fetchAvailableFields = async (): Promise<ApiField[]> => {
  try {
    // Replace with your actual API endpoint
    const response = await fetch('/api/fields');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch fields');
  } catch (error) {
    console.error('Error fetching API fields:', error);
    // Fallback to default fields if API fails - using correct ApiField structure
    return [
      { key: 'open', apiPath: '1. open', type: 'number', sample: 150.25 },
      { key: 'high', apiPath: '2. high', type: 'number', sample: 155.30 },
      { key: 'low', apiPath: '3. low', type: 'number', sample: 149.80 },
      { key: 'close', apiPath: '4. close', type: 'number', sample: 152.10 },
      { key: 'volume', apiPath: '5. volume', type: 'number', sample: 1250000 }
    ];
  }
};

export function ConfigurationPanel() {
  const { selectedWidget, setSelectedWidget, updateWidget, widgets } = useDashboard();
  const widget = widgets.find(w => w.id === selectedWidget);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<ApiField[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [availableFields, setAvailableFields] = useState<ApiField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  // Load available fields when component mounts or widget changes
  useEffect(() => {
    const loadFields = async () => {
      setIsLoadingFields(true);
      setFieldsError(null);
      try {
        const fields = await fetchAvailableFields();
        setAvailableFields(fields);
      } catch (error) {
        setFieldsError('Failed to load available fields');
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadFields();
  }, []);

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setDescription(widget.description || '');
      setSelectedFields(widget.selectedFields || []);
      setRefreshInterval(widget.config?.refreshInterval || 30000);
    }
  }, [widget]);

  if (!widget) return null;

  const handleRefreshFields = async () => {
    setIsLoadingFields(true);
    setFieldsError(null);
    try {
      const fields = await fetchAvailableFields();
      setAvailableFields(fields);
    } catch (error) {
      setFieldsError('Failed to refresh fields');
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleFieldToggle = (field: ApiField) => {
    setSelectedFields(prev => {
      const isSelected = prev.some(f => f.key === field.key);
      if (isSelected) {
        return prev.filter(f => f.key !== field.key);
      } else {
        return [...prev, field];
      }
    });
  };

  const handleSave = () => {
    updateWidget(widget.id, {
      title,
      description,
      selectedFields,
      config: {
        ...widget.config,
        refreshInterval
      }
    });
    setSelectedWidget(null);
  };

  return (
    <div className="fixed  overflow-auto right-0 top-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configure Widget
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWidget(null)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="config-title">Widget Title</Label>
                <Input
                  id="config-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="config-description">Description</Label>
                <Textarea
                  id="config-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter widget description..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Refresh Interval</Label>
                <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10 seconds</SelectItem>
                    <SelectItem value="30000">30 seconds</SelectItem>
                    <SelectItem value="60000">1 minute</SelectItem>
                    <SelectItem value="300000">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">API Fields</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshFields}
                disabled={isLoadingFields}
                className="h-8 px-2 text-xs"
              >
                {isLoadingFields ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {fieldsError && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {fieldsError}
                </div>
              )}
              
              {isLoadingFields ? (
                <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
                  Loading available fields...
                </div>
              ) : availableFields.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-600 dark:text-gray-400">
                  No fields available
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {availableFields.map((field) => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field.key}`}
                        checked={selectedFields.some(f => f.key === field.key)}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`field-${field.key}`}
                          className="text-sm font-normal cursor-pointer block"
                        >
                          {field.key}
                          <span className="text-xs text-gray-500 ml-1">({field.type})</span>
                        </Label>
                        {field.description && (
                          <p className="text-xs text-gray-400 mt-1">{field.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          API Path: {field.apiPath}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedFields.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Selected: {selectedFields.map(f => f.key).join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Widget Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>Type: <span className="font-medium capitalize">{widget.type}</span></div>
              <div>Size: <span className="font-medium">{widget.position.w} × {widget.position.h}</span></div>
              {widget.lastUpdated && (
                <div>Last Updated: <span className="font-medium">{new Date(widget.lastUpdated).toLocaleString()}</span></div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setSelectedWidget(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}