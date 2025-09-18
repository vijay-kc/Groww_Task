'use client';

import { useState } from 'react';
import { useDashboard, Widget } from '@/store/dashboard-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Table, CreditCard, Search, CheckCircle, XCircle, Loader2, Info, Database, AlertCircle } from 'lucide-react';
import { testApiConnection, ApiField } from '@/services/api'; // UPDATED: Import new ApiField type

interface AddWidgetModalProps {
  onClose: () => void;
}

export function AddWidgetModal({ onClose }: AddWidgetModalProps) {
  const { addWidget } = useDashboard();
  const [step, setStep] = useState(1);
  const [widgetType, setWidgetType] = useState<'table' | 'card' | 'chart'>('card');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [cardType, setCardType] = useState<'watchlist' | 'gainers' | 'performance' | 'financial'>('watchlist');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [timeInterval, setTimeInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // API Testing states - UPDATED to use new ApiField structure
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<'success' | 'error' | null>(null);
  const [apiError, setApiError] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<ApiField[]>([]); // Now uses ApiField with apiPath
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState<ApiField[]>([]); //  Store full ApiField objects
  const [apiResponse, setApiResponse] = useState<any>(null);


  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Widget title is required';
    }

    if (!apiEndpoint.trim()) {
      newErrors.apiEndpoint = 'API endpoint is required';
    }

    if (apiTestResult !== 'success') {
      newErrors.apiTest = 'Please test the API connection successfully';
    }

    if (selectedFields.length === 0) {
      newErrors.fields = 'Please select at least one field to display';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // UPDATED: Handle the new API response structure
  const handleTestApi = async () => {
    if (!apiEndpoint.trim()) {
      setErrors({ ...errors, apiEndpoint: 'API endpoint is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);
    setApiError('');

    try {
      const result = await testApiConnection(apiEndpoint);

      // UPDATED: Handle new response structure
      setAvailableFields(result.fields);
      setApiResponse(result.sampleData);

      setApiTestResult('success');
      setErrors({ ...errors, apiEndpoint: '', apiTest: '' });

      console.log('API Test Success:', {
        fieldsFound: result.fields.length,
        isAlphaVantage: result.sampleData.isAlphaVantage,
        sampleFields: result.fields.slice(0, 3)
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to API';
      setApiError(errorMessage);
      setApiTestResult('error');
      setErrors({ ...errors, apiTest: errorMessage });
      console.error('API Test Failed:', error);
    } finally {
      setIsTestingApi(false);
    }
  };

  const filteredFields = availableFields.filter(field =>
    field.key.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    field.description?.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  // UPDATED: Handle ApiField objects instead of strings
  const toggleFieldSelection = (field: ApiField) => {
    setSelectedFields(prev => {
      const exists = prev.some(f => f.key === field.key);
      if (exists) {
        return prev.filter(f => f.key !== field.key);
      } else {
        return [...prev, field];
      }
    });
    setErrors({ ...errors, fields: '' });
  };

  // UPDATED: Create widget with proper field structure
  const handleSubmit = () => {
    if (!validateInputs()) {
      return;
    }

    const widget: Omit<Widget, 'id'> = {
      type: widgetType,
      title: title.trim(),
      description: description.trim(),
      apiEndpoint,
      selectedFields: selectedFields, // UPDATED: Pass full ApiField objects
      config: {
        refreshInterval,
        timeInterval,
        ...(widgetType === 'card' && { cardType }),
        ...(widgetType === 'chart' && { chartType }),
      },
      position: {
        x: 0,
        y: 0,
        w: widgetType === 'table' ? 6 : widgetType === 'chart' ? 4 : 3,
        h: widgetType === 'table' ? 4 : widgetType === 'chart' ? 3 : 2
      }
    };

    console.log('Creating widget with:', {
      type: widgetType,
      selectedFields: selectedFields.map(f => ({ key: f.key, apiPath: f.apiPath })),
    });

    addWidget(widget);
    onClose();
  };

  return (
    <TooltipProvider>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-900 dark:via-indigo-900 dark:to-slate-900 border-slate-700 dark:bg-gray-700 dark:border-indigo-700/50">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-slate-100 dark:text-indigo-100">
              <Database className="w-5 h-5 text-emerald-400 dark:text-cyan-400" />
              <span>Add New Widget</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 dark:text-indigo-400" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="bg-slate-800 dark:bg-indigo-900/90 border-slate-700 dark:border-indigo-700">
                  <p className="text-slate-200 dark:text-indigo-200">Create customizable widgets to display financial data</p>
                </TooltipContent>
              </Tooltip>

            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block text-slate-200 dark:text-indigo-200">Choose Widget Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-xl bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50 hover:bg-slate-800/70 dark:hover:bg-indigo-900/50 ${widgetType === 'table'
                      ? 'ring-2 ring-emerald-500 dark:ring-cyan-500 shadow-lg shadow-emerald-500/20 dark:shadow-cyan-500/20'
                      : ''
                      }`}
                    onClick={() => setWidgetType('table')}
                  >
                    <CardHeader className="text-center pb-2">
                      <Table className="w-8 h-8 mx-auto text-emerald-500 dark:text-cyan-500" />
                      <CardTitle className="text-sm text-slate-100 dark:text-indigo-100">Stock Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400 dark:text-indigo-300 text-center">
                        Sortable table with search and pagination
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-xl bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50 hover:bg-slate-800/70 dark:hover:bg-indigo-900/50 ${widgetType === 'card'
                      ? 'ring-2 ring-emerald-500 dark:ring-cyan-500 shadow-lg shadow-emerald-500/20 dark:shadow-cyan-500/20'
                      : ''
                      }`}
                    onClick={() => setWidgetType('card')}
                  >
                    <CardHeader className="text-center pb-2">
                      <CreditCard className="w-8 h-8 mx-auto text-rose-500 dark:text-pink-500" />
                      <CardTitle className="text-sm text-slate-100 dark:text-indigo-100">Finance Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400 dark:text-indigo-300 text-center">
                        Single or multiple field cards with key metrics
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-xl bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50 hover:bg-slate-800/70 dark:hover:bg-indigo-900/50 ${widgetType === 'chart'
                      ? 'ring-2 ring-emerald-500 dark:ring-cyan-500 shadow-lg shadow-emerald-500/20 dark:shadow-cyan-500/20'
                      : ''
                      }`}
                    onClick={() => setWidgetType('chart')}
                  >
                    <CardHeader className="text-center pb-2">
                      <BarChart3 className="w-8 h-8 mx-auto text-violet-500 dark:text-purple-500" />
                      <CardTitle className="text-sm text-slate-100 dark:text-indigo-100">Stock Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-slate-400 dark:text-indigo-300 text-center">
                        Interactive charts with multiple time intervals
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose} className="bg-white text-red-600 border border-red-300 shadow-lg 
             hover:bg-red-100 hover:text-red-600 dark:bg-slate-900 dark:text-red-400 
             dark:border-red-800 dark:hover:bg-red-950">
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-cyan-600 dark:to-blue-600 hover:from-emerald-700 hover:to-teal-700 dark:hover:from-cyan-700 dark:hover:to-blue-700 text-white shadow-lg">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Basic Configuration */}
              <Card className="bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2 text-slate-100 dark:text-indigo-100">
                    <span>Basic Configuration</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-400 dark:text-indigo-400" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 dark:bg-indigo-900/90 border-slate-700 dark:border-indigo-700">
                        <p className="text-slate-200 dark:text-indigo-200">Set up basic widget properties</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-slate-200 dark:text-indigo-200">Widget Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setErrors({ ...errors, title: '' });
                      }}
                      placeholder={`My ${widgetType} widget`}
                      className={`bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100 placeholder-slate-400 dark:placeholder-indigo-400 focus:border-emerald-500 dark:focus:border-cyan-500 ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="text-red-400 dark:text-pink-400 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-slate-200 dark:text-indigo-200">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this widget"
                      rows={2}
                      className="bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100 placeholder-slate-400 dark:placeholder-indigo-400 focus:border-emerald-500 dark:focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="refresh" className="text-slate-200 dark:text-indigo-200">Refresh Interval</Label>
                    <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                      <SelectTrigger className="bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 dark:bg-indigo-900 border-slate-700 dark:border-indigo-700">
                        <SelectItem value="5000" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">5 seconds</SelectItem>
                        <SelectItem value="10000" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">10 seconds</SelectItem>
                        <SelectItem value="30000" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">30 seconds</SelectItem>
                        <SelectItem value="60000" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">1 minute</SelectItem>
                        <SelectItem value="300000" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {widgetType === 'chart' && (
                    <div>
                      <Label className="text-slate-200 dark:text-indigo-200">Time Interval</Label>
                      <Select value={timeInterval} onValueChange={(value: any) => setTimeInterval(value)}>
                        <SelectTrigger className="bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 dark:bg-indigo-900 border-slate-700 dark:border-indigo-700">
                          <SelectItem value="daily" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Daily</SelectItem>
                          <SelectItem value="weekly" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Weekly</SelectItem>
                          <SelectItem value="monthly" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Widget Type Specific Options */}
                  {widgetType === 'card' && (
                    <div>
                      <Label className="text-slate-200 dark:text-indigo-200">Card Type</Label>
                      <Select value={cardType} onValueChange={(value: any) => setCardType(value)}>
                        <SelectTrigger className="bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 dark:bg-indigo-900 border-slate-700 dark:border-indigo-700">
                          <SelectItem value="watchlist" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Watchlist</SelectItem>
                          <SelectItem value="gainers" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Market Gainers</SelectItem>
                          <SelectItem value="performance" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Performance Data</SelectItem>
                          <SelectItem value="financial" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Financial Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {widgetType === 'chart' && (
                    <div>
                      <Label className="text-slate-200 dark:text-indigo-200">Chart Type</Label>
                      <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                        <SelectTrigger className="bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 dark:bg-indigo-900 border-slate-700 dark:border-indigo-700">
                          <SelectItem value="line" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Line Chart</SelectItem>
                          <SelectItem value="candlestick" className="text-slate-100 dark:text-indigo-100 hover:bg-slate-700 dark:hover:bg-indigo-800">Candlestick Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card className="bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2 text-slate-100 dark:text-indigo-100">
                    <span>API Configuration</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-400 dark:text-indigo-400" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 dark:bg-indigo-900/90 border-slate-700 dark:border-indigo-700">
                        <p className="text-slate-200 dark:text-indigo-200">Connect to financial data API</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="api" className="text-slate-200 dark:text-indigo-200">API Endpoint *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="api"
                        value={apiEndpoint}
                        onChange={(e) => {
                          setApiEndpoint(e.target.value);
                          setErrors({ ...errors, apiEndpoint: '', apiTest: '' });
                          setApiTestResult(null);
                        }}
                        placeholder="https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&apikey=demo"
                        className={`flex-1 bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100 placeholder-slate-400 dark:placeholder-indigo-400 focus:border-emerald-500 dark:focus:border-cyan-500 ${errors.apiEndpoint ? 'border-red-500' : ''}`}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleTestApi}
                            disabled={isTestingApi || !apiEndpoint.trim()}
                            variant="outline"
                            className="min-w-[100px] text-black border-slate-600 dark:border-indigo-600 dark:text-indigo-300 hover:bg-slate-300 dark:hover:bg-indigo-900/50"

                          >
                            {isTestingApi ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2 text-emerald-400 dark:text-cyan-400" />
                            ) : apiTestResult === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-cyan-500 mr-2" />
                            ) : apiTestResult === 'error' ? (
                              <XCircle className="w-4 h-4 text-red-500 dark:text-pink-500 mr-2" />
                            ) : null}
                            Test API
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                        side='left'
                        sideOffset={8}
                        className="z-50 bg-slate-800 dark:bg-indigo-900/90 border-slate-700 dark:border-indigo-700">
                          <p className="text-slate-200 dark:text-indigo-200">Test connection to verify API endpoint</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {errors.apiEndpoint && (
                      <p className="text-red-400 dark:text-pink-400 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.apiEndpoint}
                      </p>
                    )}
                    {apiTestResult === 'success' && (
                      <p className="text-emerald-400 dark:text-cyan-400 text-xs mt-1 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        API connection successful - {availableFields.length} fields found
                      </p>
                    )}
                    {apiTestResult === 'error' && (
                      <p className="text-red-400 dark:text-pink-400 text-xs mt-1 flex items-center">
                        <XCircle className="w-3 h-3 mr-1" />
                        {apiError || 'API connection failed'}
                      </p>
                    )}
                    {errors.apiTest && (
                      <p className="text-red-400 dark:text-pink-400 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.apiTest}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Field Selection - UPDATED to handle ApiField objects */}
              {apiTestResult === 'success' && availableFields.length > 0 && (
                <Card className="bg-slate-800/50 dark:bg-indigo-900/30 border-slate-700 dark:border-indigo-700/50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2 text-slate-100 dark:text-indigo-100">
                      <span>Data Field Selection</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-slate-400 dark:text-indigo-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 dark:bg-indigo-900/90 border-slate-700 dark:border-indigo-700">
                          <p className="text-slate-200 dark:text-indigo-200">Choose which data fields to display in your widget</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-indigo-400 w-4 h-4" />
                      <Input
                        placeholder="Search fields..."
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        className="pl-10 bg-slate-900/50 dark:bg-indigo-950/50 border-slate-600 dark:border-indigo-600 text-slate-100 dark:text-indigo-100 placeholder-slate-400 dark:placeholder-indigo-400 focus:border-emerald-500 dark:focus:border-cyan-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-700 dark:border-indigo-700/50 rounded-lg p-3 space-y-2 bg-slate-900/30 dark:bg-indigo-950/30">
                      {filteredFields.map((field) => (
                        <div
                          key={field.key}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedFields.some(f => f.key === field.key)
                            ? 'bg-emerald-500/20 dark:bg-cyan-500/20 border border-emerald-500/40 dark:border-cyan-500/40'
                            : 'hover:bg-slate-800/50 dark:hover:bg-indigo-900/50'
                            }`}
                          onClick={() => toggleFieldSelection(field)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedFields.some(f => f.key === field.key)}
                              onChange={() => { }}
                              className="border-slate-500 dark:border-indigo-500 data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-cyan-600"
                            />
                            <div>
                              <span className="font-medium text-sm text-slate-100 dark:text-indigo-100">{field.key}</span>
                              <p className="text-xs text-slate-400 dark:text-indigo-300">{field.description}</p>
                              <p className="text-xs text-slate-500 dark:text-indigo-400 font-mono">
                                Sample: {JSON.stringify(field.sample)}
                              </p>
                              {/* NEW: Show API path for debugging */}
                              {field.apiPath && (
                                <p className="text-xs text-slate-600 dark:text-indigo-500 font-mono">
                                  Path: {field.apiPath}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs border-slate-600 dark:border-indigo-600 text-slate-300 dark:text-indigo-300">
                            {field.type}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {selectedFields.length > 0 && (
                      <div>
                        <Label className="text-sm text-slate-200 dark:text-indigo-200">Selected Fields ({selectedFields.length})</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedFields.map((field) => (
                            <Badge
                              key={field.key}
                              variant="default"
                              className="cursor-pointer bg-emerald-600 dark:bg-cyan-600 hover:bg-emerald-700 dark:hover:bg-cyan-700 text-white shadow-lg"
                              onClick={() => toggleFieldSelection(field)}
                            >
                              {field.key} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.fields && (
                      <p className="text-red-400 dark:text-pink-400 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.fields}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="bg-white text-black border border-slate-600 shadow-lg 
             hover:bg-gray-300
             dark:bg-gray-900  dark:text-indigo-300
             dark:border-indigo-600  dark:hover:bg-indigo-900/50"
                >
                  Back
                </Button>
                <div className="space-x-3">
                  <Button variant="outline" onClick={onClose} className="bg-white text-red-600 border border-red-300 shadow-lg 
             hover:bg-red-200 hover:text-red-600 dark:bg-slate-900 dark:text-red-400 
             dark:border-red-800 dark:hover:bg-red-950">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-cyan-600 dark:to-blue-600 hover:from-emerald-700 hover:to-teal-700 dark:hover:from-cyan-700 dark:hover:to-blue-700 text-white shadow-lg shadow-emerald-500/25 dark:shadow-cyan-500/25"
                  >
                    Create Widget
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}