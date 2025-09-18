"use client";

import { Widget, useDashboard } from "@/store/dashboard-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  RefreshCw,
  Trash2,
  MoreVertical,
  Table,
  CreditCard,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import your individual widget components
import { FinanceCard } from "./FinanceCard";
import { StockTable } from "./StockTable";
import { StockChart } from "./StockChart";
import { useState } from "react";
// import { ChartWidget } from './ChartWidget'; // You'll need to create this

interface WidgetCardProps {
  widget: Widget;
}

export function WidgetCard({ widget }: WidgetCardProps) {

  const [isExpanded, setIsExpanded] = useState(false);
  const { removeWidget, setSelectedWidget, refreshWidgetData, isEditMode } =
    useDashboard();

  const handleRefresh = () => {
    refreshWidgetData(widget.id);
  };

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this widget?")) {
      removeWidget(widget.id);
    }
  };

  const handleConfigure = () => {
    setSelectedWidget(widget.id);
  };

  const getWidgetIcon = () => {
    switch (widget.type) {
      case "table":
        return <Table className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      case "chart":
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const renderWidget = () => {
    switch (widget.type) {
      case "table":
        return <StockTable widget={widget} />;
      case "card":
        return <FinanceCard widget={widget} />;
      case "chart":
        return <StockChart widget={widget} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={`h-full flex flex-col ${isEditMode ? " border-dashed border-red-300" : ""
          }`}
      >
        <CardHeader className="pb-1 px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getWidgetIcon()}
              <CardTitle className="text-md capitalize font-medium truncate">
                {widget.title}
              </CardTitle>

              {/* Status Indicators */}
              <div className="flex items-center space-x-1">
                {widget.isLoading && (
                  <Tooltip>
                    <TooltipTrigger>
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Loading data...</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {widget.error && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Error: {widget.error}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Widget Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConfigure}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRemove}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {widget.description && (
            <div className="max-w-full text-sm text-gray-500">
              {isExpanded || widget.description.length <= 40 ? (
                <div>
                  <p className="break-words">
                    {widget.description}
                  </p>
                  {widget.description.length > 40 && (
                    <div className="mt-1">
                      <button
                        className="text-blue-500 hover:underline text-xs"
                        onClick={() => setIsExpanded(false)}
                      >
                        Show less
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-start">
                  <p className="truncate flex-1">
                    {widget.description}
                  </p>
                  <button
                    className="text-blue-500 ml-2 hover:underline flex-shrink-0 text-xs"
                    onClick={() => setIsExpanded(true)}
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          )}

        </CardHeader>

        {/* Content grows naturally */}
        {widget.type === "card" ? (
          <CardContent className="p-0 ">
            <FinanceCard widget={widget} />
          </CardContent>
        ) : (
          <CardContent className="flex-1 p-0 overflow-hidden">
            {renderWidget()}
          </CardContent>
        )}

        {/* Footer stays pinned at the bottom */}
        {widget.lastUpdated && !isEditMode && (
          <div className="px-4 py-1 bg-white  border-t rounded-b-md dark:bg-gray-800">
            <p className="text-xs text-gray-400">
              Updated: {new Date(widget.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
