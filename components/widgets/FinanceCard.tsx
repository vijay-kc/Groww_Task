'use client';

import { Widget, useDashboard } from '@/store/dashboard-store';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Star, DollarSign, Activity, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface FinanceCardProps {
  widget: Widget;
  onHeightChange?: (height: number) => void; // Add this prop
}

export function FinanceCard({ widget, onHeightChange }: FinanceCardProps) {
  const { refreshWidgetData } = useDashboard();
  const cardRef = useRef<HTMLDivElement>(null);

  // ✅ Auto-refresh data based on refresh interval
  useEffect(() => {
    const refreshInterval = widget.config.refreshInterval || 30000;
    const interval = setInterval(() => {
      refreshWidgetData(widget.id);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [widget.id, widget.config.refreshInterval, refreshWidgetData]);

  // ✅ Monitor height changes and report back to grid
  useEffect(() => {
    if (!cardRef.current || !onHeightChange) return;

    const resizeObserver = new ResizeObserver(entries => {
      const height = entries[0].contentRect.height;
      onHeightChange(height);
    });

    resizeObserver.observe(cardRef.current);
    
    // Initial height report
    const initialHeight = cardRef.current.offsetHeight;
    if (initialHeight > 0) {
      onHeightChange(initialHeight);
    }

    return () => resizeObserver.disconnect();
  }, [onHeightChange, widget.data]); // Re-run when data changes

  // ✅ Use data from widget store instead of fetching separately
  const data = widget.data;
  const isLoading = widget.isLoading;
  const error = widget.error;

  // Loading state
  if (isLoading) {
    return (
      <div ref={cardRef} className="flex items-center justify-center min-h-[120px]">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <div className="text-xs text-gray-500">Loading card data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={cardRef} className="flex items-center justify-center min-h-[120px]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <div className="text-xs text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div ref={cardRef} className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <DollarSign className="w-8 h-8 mx-auto text-gray-400" />
          <div className="text-xs text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const { cardType } = widget.config;
  
  // Use ApiField objects to get field names correctly
  const visibleFields = widget.selectedFields.length > 0 
    ? widget.selectedFields.map(field => field.key) // Extract key from ApiField
    : ['close', 'change', 'volume'];

  const renderIcon = () => {
    switch (cardType) {
      case 'watchlist':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'gainers':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'performance':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'financial':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    
    switch (field) {
      case 'close':
      case 'price':
      case 'open':
      case 'high':
      case 'low':
        return `$${Number(value).toFixed(2)}`;
      case 'change':
      case 'changePercent':
        return `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
      case 'volume':
        return Number(value).toLocaleString();
      case 'marketCap':
        const cap = Number(value);
        if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
        if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
        if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
        return `$${cap.toLocaleString()}`;
      case 'pe':
      case 'eps':
      case 'beta':
        return Number(value).toFixed(2);
      case 'dividendYield':
        return `${Number(value).toFixed(2)}%`;
      default:
        return value.toString();
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      close: 'Price',
      price: 'Price',
      open: 'Open',
      high: 'High',
      low: 'Low',
      change: 'Change',
      changePercent: 'Change %',
      volume: 'Volume',
      marketCap: 'Market Cap',
      pe: 'P/E Ratio',
      eps: 'EPS',
      high52Week: '52W High',
      low52Week: '52W Low',
      dividendYield: 'Dividend Yield',
      beta: 'Beta',
      lastRefreshed: 'Updated'
    };
    return labels[field] || field;
  };

  // Calculate additional fields for dynamic layout
  const additionalFields = visibleFields.filter(field => 
    !['close', 'price', 'change', 'volume'].includes(field)
  );

  return (
    <TooltipProvider>
      <div 
        ref={cardRef}
        className="w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex flex-col p-2"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
              {renderIcon()}
            </div>
            <Badge variant="secondary" className="text-xs font-semibold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {cardType?.toUpperCase() || 'DATA'}
            </Badge>
          </div>
          {/* Volume moved to right of card type */}
          {visibleFields.includes('volume') && data.volume !== undefined && (
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {formatValue(data.volume, 'volume')}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content - Dynamic Height Layout */}
        <div className="flex flex-col space-y-1.5 flex-grow">
          
          {/* Top Section Primary Price with Mini Stats */}
          <div className="flex-shrink-0">
            {(visibleFields.includes('close') || visibleFields.includes('price')) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Current Price</div>
                    <div className="text-lg font-black text-gray-900 dark:text-white">
                      {formatValue(data.close || data.price, 'close')}
                    </div>
                  </div>
                  {visibleFields.includes('change') && data.change !== undefined && (
                    <div className="text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        {(data.change || 0) >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400">Change</span>
                      </div>
                      <div className={`text-sm font-bold ${(data.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatValue(data.change, 'change')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Auto-sizing Stats Grid */}
          {additionalFields.length > 0 && (
            <div className="flex-grow">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-1.5">
                <div className="grid grid-cols-3 gap-1.5 auto-rows-max">
                  {additionalFields.map((field) => (
                    <Tooltip key={field}>
                      <TooltipTrigger>
                        <div className="bg-white dark:bg-gray-700 rounded-md p-1.5 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow cursor-pointer min-h-[45px] flex flex-col justify-center">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 truncate leading-tight">
                              {getFieldLabel(field)}
                            </div>
                            <div className={`text-xs font-semibold truncate leading-tight ${
                              field === 'high' ? 'text-green-600 dark:text-green-400' :
                              field === 'low' ? 'text-red-600 dark:text-red-400' :
                              field === 'open' ? 'text-blue-600 dark:text-blue-400' :
                              field === 'volume' ? 'text-purple-600 dark:text-purple-400' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {formatValue(data[field], field)}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{getFieldLabel(field)}: {formatValue(data[field], field)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}