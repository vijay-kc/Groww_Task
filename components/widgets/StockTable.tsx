"use client";

import { useState, useEffect } from "react";
import { Widget, useDashboard } from "@/store/dashboard-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface StockTableProps {
  widget: Widget; 
}

type SortField = "change" | "volume" | "date" | "open" | "high" | "low" | "close";
type SortDirection = "asc" | "desc";

export function StockTable({ widget }: StockTableProps) {
  const { refreshWidgetData } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ✅ Auto-refresh data based on refresh interval
  useEffect(() => {
    const refreshInterval = widget.config.refreshInterval || 30000;
    const interval = setInterval(() => {
      refreshWidgetData(widget.id);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [widget.id, widget.config.refreshInterval, refreshWidgetData]);

  // ✅ Use data from widget store instead of fetching separately
  const data = widget.data;
  const isLoading = widget.isLoading;
  const error = widget.error;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <div className="text-xs text-gray-500">Loading table data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2 p-4">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <div className="text-xs text-red-600">{error}</div>
          <Button 
            size="sm" 
            onClick={() => refreshWidgetData(widget.id)}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Handle both data.stocks and direct array data
  const stocks = data?.stocks || (Array.isArray(data) ? data : []);

  if (!stocks || stocks.length === 0) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center space-y-2">
          <Table className="w-8 h-8 mx-auto text-gray-400" />
          <div className="text-xs text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  // Filter stocks based on search term
  const filteredStocks = stocks.filter((stock: any) =>
    Object.values(stock).some((value: any) => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort stocks
  const sortedStocks = [...filteredStocks].sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle numeric sorting
    if (["change", "volume", "open", "high", "low", "close"].includes(sortField)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    // Handle date sorting
    if (sortField === "date") {
      aValue = new Date(aValue).getTime() || 0;
      bValue = new Date(bValue).getTime() || 0;
    }

    // Handle string sorting
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-blue-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-500" />
    );
  };

  const formatValue = (value: any, field: string) => {
    if (value === null || value ===  undefined) return "N/A";

    switch (field) {
      case "close":
      case "price":
      case "open":
      case "high":
      case "low":
        return `$${Number(value).toFixed(2)}`;
      case "change":
        return `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`;
      case "volume":
        return Number(value).toLocaleString();
      case "date":
        return new Date(value).toLocaleDateString();
      default:
        return value.toString();
    }
  };

  // ✅ FIXED: Use ApiField objects to get field names correctly
  const visibleFields = widget.selectedFields.length > 0
    ? widget.selectedFields.map(field => field.key) // Extract key from ApiField
    : [ "date", "open", "high", "low", "close","change" ,"volume"];

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: "Name",
      date: "Date",
      open: "Open",
      high: "High", 
      low: "Low",
      close: "Close",
      price: "Price",
      change: "Change",
      changePercent: "Change %",
      volume: "Volume",
      marketCap: "Market Cap",
      pe: "P/E",
      eps: "EPS",
      high52Week: "52W High",
      low52Week: "52W Low",
      dividendYield: "Dividend",
      beta: "Beta",
    };
    return labels[field] || field;
  };

  return (
    <TooltipProvider>
      <div className="h-full overflow-auto">
        {/* Search Bar */}
        <div className="p-3 border-b bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-8 bg-white dark:bg-gray-950"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 text-xs text-gray-500">
              {filteredStocks.length} of {stocks.length} rows shown
            </div>
          )}
          
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleFields.map((field) => (
                  <TableHead key={field} className="text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(field as SortField)}
                          className="h-auto p-1 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <span className="mr-1">{getFieldLabel(field)}</span>
                          {getSortIcon(field as SortField)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to sort by {getFieldLabel(field)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStocks.map((row: any, index: number) => (
                <TableRow
                  key={ row.date || index}
                  className="bg-gradient-to-br dark:from-gray-800 dark:to-gray-950   hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                >
                  {visibleFields.map((field) => (
                    <TableCell key={field} className="text-xs py-2">
                      {field === "change" || field === "changePercent" ? (
                      // <span>{row[field]}</span>
                        row[field] !== undefined ? (
                          <div className="flex items-center space-x-1">
                            {Number(row[field]) >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <Badge
                              variant={
                                Number(row[field]) >= 0 ? "default" : "destructive"
                              }
                              className={`text-xs ${
                                Number(row[field]) >= 0
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : ""
                              }`}
                            >
                              {formatValue(row[field], field)}
                            </Badge>
                          </div>
                        ) : (
                          <span></span>
                        )
                      ) : (
                        <span>{formatValue(row[field], field)}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* No Results Message */}
        {filteredStocks.length === 0 && searchTerm && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data found matching {searchTerm}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="mt-2 text-xs"
              >
                Clear search
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}