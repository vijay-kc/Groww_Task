"use client";

import { Widget } from "@/store/dashboard-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { getTimeIntervalData } from "@/services/api";
import { Button } from "../ui/button";


interface StockChartProps {
  widget: Widget;
}

export function StockChart({ widget }: StockChartProps) {
  const [selectedInterval, setSelectedInterval] = useState(widget.config.timeInterval || "daily");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const colors = [ "#10b981", "#f59e0b", "#ef4444", "#8b5cf6","#3b82f6"];

  useEffect(() => {
    const loadChartData = async () => {
      if (!widget.apiEndpoint) return;

      setIsLoading(true);
      try {
        // Extract symbol from API endpoint or use default
        const urlParams = new URLSearchParams(widget.apiEndpoint.split("?")[1]);
        const symbol = urlParams.get("symbol") || "IBM";

        const data = await getTimeIntervalData(
          symbol,
          selectedInterval as any,
          widget.apiEndpoint
        );
        setChartData(data.chartData || []);
      } catch (error) {
        console.error("Failed to load chart data:", error);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();
  }, [selectedInterval, widget.apiEndpoint]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 w-full mb-2 rounded"></div>
          <div className="text-xs text-gray-500">Loading chart data...</div>
        </div>
      </div>
    );
  }
  if (widget.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2 p-4">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <div className="text-xs text-red-600">{widget.error}</div>
          {/* <Button 
            size="sm" 
            onClick={() => refreshWidgetData(widget.id)}
            className="text-xs"
          >
            Retry
          </Button> */}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-500">No chart data available</div>
        </div>
      </div>
    );
  }

  const { chartType = "line" } = widget.config;

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return labels[interval] || interval;
  };

  const formatTooltipValue = (value: any, name: string) => {
    if (
      name === "change"  ||
      name === "close" ||
      name === "open" ||
      name === "high" ||
      name === "low"
    ) {
      return [
        `$${Number(value).toFixed(2)}`,
        name.charAt(0).toUpperCase() + name.slice(1),
      ];
    }
    if (name === "volume") {
      return [Number(value).toLocaleString(), "Volume"];
    }
    return [value, name];
  };

  const formatYAxisTick = (value: number, fieldKey: string) => {
    if (["open", "high", "low", "close"].includes(fieldKey)) {
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toFixed(1)}`;
    }

    if (fieldKey === "volume") {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
      return value.toString(); // convert to string
    }

    return value.toString(); // always string
  };

  const formatXAxisTick = (value: string) => {
    const date = new Date(value);
    switch (selectedInterval) {
      case "daily":
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "weekly":
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      case "monthly":
        return date.toLocaleDateString([], { month: "short", year: "2-digit" });
      default:
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full w-full space-y-3">
        {/* Chart Controls */}
        <div className="flex items-center justify-between px-2">
          {/* interval selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Interval:</span>
            <Select
              value={selectedInterval}
              onValueChange={(value) =>
                setSelectedInterval(value as "daily" | "weekly" | "monthly")
              }
            >
              <SelectTrigger className="w-24 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {chartData[0]?.symbol || "Stock"}
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Chart showing {getIntervalLabel(selectedInterval)} intervals
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[calc(100%-2rem)] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                  tickFormatter={formatXAxisTick}
                  interval="preserveStartEnd"
                />
                <YAxis
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                  width={50}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickFormatter={(value) => formatYAxisTick(value, widget.selectedFields[0]?.key || "")}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                  formatter={formatTooltipValue}
                />

                <Line
                  type="monotone"
                  dataKey={widget.selectedFields[0]?.key}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                  tickFormatter={formatXAxisTick}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                  tickFormatter={(value) => formatYAxisTick(value, widget.selectedFields[0]?.key || "")}
                />
                <RechartsTooltip
                  contentStyle={{
                    color: "white",
                    backgroundColor: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={formatTooltipValue}
                />
                {widget.selectedFields.map((field, index) => (
                  <Line
                    key={field.key}
                    type="monotone"
                    dataKey={field.key}
                    stroke={colors[index % colors.length]} // rotate colors
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: colors[index % colors.length] }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </TooltipProvider>
  );
}
