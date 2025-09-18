// Alpha Vantage API service for real financial data

export interface Data {
  price: number;
  change: number;
  chartData?: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// stores both display name and actual API path
export interface ApiField {
  key: string; // Display name: "open", "high", etc.
  apiPath: string; // Actual API path: "1. open", "2. high", etc.
  type: string;
  sample: any;
  description?: string;
}

export interface ApiSymbol {
  symbol: string;
  name: string;
  type?: string;
}
//api is connect successfully
const isAlphaVantageResponse = (data: any): boolean => {
  return (
    data &&
    (data["Meta Data"] ||
      data["Time Series (Daily)"] ||
      data["Weekly Time Series"] ||
      data["Monthly Time Series"] ||
      data["Time Series (5min)"] ||
      data["Time Series (15min)"] ||
      data["Time Series (30min)"] ||
      data["Time Series (60min)"])
  );
};

// Smart field extraction for api
const parseAlphaVantageResponse = (
  data: any
): { fields: ApiField[]; chartData: any[] } => {
  const fields: ApiField[] = [];
  const chartData: any[] = [];

  // Find the time series key
  let timeSeriesKey = "";
  let timeSeries: any = null;

  const possibleKeys = [
    "Time Series (Daily)",
    "Weekly Time Series",
    "Monthly Time Series",
    "Time Series (5min)",
    "Time Series (15min)",
    "Time Series (30min)",
    "Time Series (60min)",
  ];

  for (const key of possibleKeys) {
    if (data[key]) {
      timeSeriesKey = key;
      timeSeries = data[key];
      break;
    }
  }

  if (!timeSeries) {
    throw new Error("No field data of time series data found in API");
  }

  const dates = Object.keys(timeSeries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (dates.length === 0) {
    throw new Error("No time series data found");
  }

  // Extract OHLCV fields from the first data point
  const firstDataPoint = timeSeries[dates[0]];
  Object.keys(firstDataPoint).forEach((apiKey) => {
    // Remove the number prefix: "1. open" → "open"
    const cleanKey = apiKey.replace(/^\d+\.\s*/, "");

    fields.push({
      key: cleanKey, // Display name: "open"
      apiPath: `timeSeries.${apiKey}`, // API path: "timeSeries.1. open"
      type: "number",
      sample: firstDataPoint[apiKey],
      description: getFieldDescription(cleanKey),
    });
  });

  // Add derived fields that widgets might want
  fields.push({
    key: "change",
    apiPath: "calculated.change", // Special marker for calculated field
    type: "number",
    sample: 2.5,
    description: "Price change percentage",
  });

  // Convert time series to chart data for widgets
  dates.forEach((date) => {
    const dayData = timeSeries[date];
    chartData.push({
      open: parseFloat(dayData["1. open"]),
      high: parseFloat(dayData["2. high"]),
      low: parseFloat(dayData["3. low"]),
      close: parseFloat(dayData["4. close"]),
      volume: parseInt(dayData["5. volume"]),
    });
  });

  return { fields, chartData };
};

// FIXED: Generic API response parser for non-Alpha Vantage APIs
const parseGenericAPIResponse = (
  data: any
): { fields: ApiField[]; chartData: any[] } => {
  const fields: ApiField[] = [];

  // Recursively extract fields from any JSON structure
  const extractFields = (
    obj: any,
    prefix = "",
    maxDepth = 3,
    currentDepth = 0
  ) => {
    if (currentDepth > maxDepth) return;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Nested object - recurse
        extractFields(value, fullPath, maxDepth, currentDepth + 1);
      } else {
        // Leaf value - add as field
        fields.push({
          key: key,
          apiPath: fullPath,
          type: Array.isArray(value) ? "array" : typeof value,
          sample: Array.isArray(value) ? value.slice(0, 2) : value,
          description: `${key} field`,
        });
      }
    });
  };

  extractFields(data);

  return { fields, chartData: [] };
};

const getFieldDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    open: "Opening price for the trading day",
    high: "Highest price during the trading day",
    low: "Lowest price during the trading day",
    close: "Closing price for the trading day",
    volume: "Number of shares traded",
  };
  return descriptions[key] || `${key} data field`;
};

// FIXED: Smart API connection tester
export const testApiConnection = async (
  apiUrl: string
): Promise<{ fields: ApiField[]; sampleData: any }> => {
  try {
    // For Alpha Vantage APIs, ensure we have a symbol for testing
    let testUrl = apiUrl;
    if (apiUrl.includes("alphavantage.co") && !apiUrl.includes("symbol=")) {
      testUrl = `${apiUrl}&symbol=IBM`;
    }

    const response = await fetch(testUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for Alpha Vantage specific errors
    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    if (data["Note"]) {
      throw new Error(
        "API call frequency limit reached. Please try again later."
      );
    }

    // Check if it's Alpha Vantage or generic API
    let fields: ApiField[];
    let chartData: any[] = [];

    if (isAlphaVantageResponse(data)) {
      const result = parseAlphaVantageResponse(data);
      fields = result.fields;
      chartData = result.chartData;
    } else {
      const result = parseGenericAPIResponse(data);
      fields = result.fields;
      chartData = result.chartData;
    }

    return {
      fields,
      sampleData: {
        chartData,
        rawResponse: data,
      },
    };
  } catch (error) {
    console.error("API test failed:", error);
    throw error;
  }
};

//  Data fetcher that uses the correct API paths
export const fetchWidgetData = async (
  apiUrl: string,
  selectedFields: ApiField[],
  widgetType: "table" | "card" | "chart"
): Promise<any> => {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("FinanceCard widget.data:", data, widgetType);

    // Check for API errors
    if (data["Error Message"]) {
      throw new Error(data["Error Message"]);
    }

    if (data["Information"]) {
      throw new Error(
        "API call frequency limit reached. Please try again later."
      );
    }

    // Handle Alpha Vantage responses specially
    if (isAlphaVantageResponse(data)) {
      return extractAlphaVantageData(data, selectedFields, widgetType);
    } else {
      return extractGenericData(data, selectedFields, widgetType);
    }
  } catch (error) {
    console.error("Failed to fetch widget data:", error);
    throw error;
  }
};

// Extract data using the correct API
const extractAlphaVantageData = (
  data: any,
  selectedFields: ApiField[],
  widgetType: string
) => {
  // Find the time series key
  let timeSeriesKey = "";
  let timeSeries: any = null;
  const possibleKeys = [
    "Time Series (Daily)",
    "Weekly Time Series",
    "Monthly Time Series",
    "Time Series (5min)",
    "Time Series (15min)",
    "Time Series (30min)",
    "Time Series (60min)",
  ];
  for (const key of possibleKeys) {
    if (data[key]) {
      timeSeriesKey = key;
      timeSeries = data[key];
      break;
    }
  }
  if (!timeSeries) {
    throw new Error("No time series data found");
  }
  
  const dates = Object.keys(timeSeries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Helper function to calculate change between two periods
  const calculateChange = (currentClose: string, previousClose: string) => {
    if (!currentClose || !previousClose) return 0;
    const current = parseFloat(currentClose);
    const previous = parseFloat(previousClose);
    return ((current - previous) / previous) * 100;
  };

  // Helper function to extract field value from day data
  const extractFieldValue = (dayData: any, fieldKey: string) => {
    if (fieldKey === "date") return null; // handled separately
    
    const numberedKeys = Object.keys(dayData).filter((k) =>
      k.includes(fieldKey)
    );
    if (numberedKeys.length > 0) {
      const value = dayData[numberedKeys[0]];
      return isNaN(parseFloat(value)) ? value : parseFloat(value);
    }
    return null;
  };

  const latestDate = dates[0];
  const latestData = timeSeries[latestDate];
  const previousData = timeSeries[dates[1]];

  // Extract selected field values for card widget
  const extractedData: any = {};
  selectedFields.forEach((field) => {
    if (field.key === "change") {
      extractedData[field.key] = calculateChange(
        latestData["4. close"],
        previousData?.["4. close"]
      );
    } else {
      const value = extractFieldValue(latestData, field.key);
      if (value !== null) {
        extractedData[field.key] = value;
      }
    }
  });

  // Format for different widget types
  if (widgetType === "chart") {
    const chartData = dates.slice(0, 20)
      .map((date, index) => {
        const dayData = timeSeries[date];
        const previousDayData = index < dates.length - 1 ? timeSeries[dates[index + 1]] : null;
        
        return {
          open: parseFloat(dayData["1. open"]),
          high: parseFloat(dayData["2. high"]),
          low: parseFloat(dayData["3. low"]),
          close: parseFloat(dayData["4. close"]),
          volume: parseInt(dayData["5. volume"]),
          change: calculateChange(dayData["4. close"], previousDayData?.["4. close"]),
          date
        };
      })
      .reverse();
    return { chartData };
  }

  if (widgetType === "table") {
    const stocks = dates.slice(0, 20).map((date, index) => {
      const dayData = timeSeries[date];
      const previousDayData = index < dates.length - 1 ? timeSeries[dates[index + 1]] : null;
      const row: any = { date };
      
      selectedFields.forEach((field) => {
        if (field.key === "change") {
          row[field.key] = calculateChange(
            dayData["4. close"],
            previousDayData?.["4. close"]
          );
        } else if (field.key !== "date") {
          const value = extractFieldValue(dayData, field.key);
          if (value !== null) {
            row[field.key] = value;
          }
        }
      });
      
      return row;
    });
    return { stocks };
  }
  
  // Card widget
  if (widgetType === "card") {
    return {
      ...extractedData,
      price: extractedData.close, // alias for FinanceCard
    };
  }
};

// Extract data from generic APIs
const extractGenericData = (
  data: any,
  selectedFields: ApiField[],
  widgetType: string
) => {
  const extractedData: any = {};

  selectedFields.forEach((field) => {
    const value = getNestedValue(data, field.apiPath);
    extractedData[field.key] = value;
  });

  return extractedData;
};

// Helper function to get nested values from object using dot notation
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Legacy functions for backward compatibility
export const fetchStockData = async (
  symbol: string,
  widgetType: "table" | "card" | "chart",
  apiUrl?: string
): Promise<any> => {
  const url =
    apiUrl ||
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&apikey=demo&symbol=${symbol}`;

  // Create default fields for legacy support
  const defaultFields: ApiField[] = [
    {
      key: "open",
      apiPath: "timeSeries.1. open",
      type: "number",
      sample: 0,
      description: "Opening price",
    },
    {
      key: "high",
      apiPath: "timeSeries.2. high",
      type: "number",
      sample: 0,
      description: "High price",
    },
    {
      key: "low",
      apiPath: "timeSeries.3. low",
      type: "number",
      sample: 0,
      description: "Low price",
    },
    {
      key: "close",
      apiPath: "timeSeries.4. close",
      type: "number",
      sample: 0,
      description: "Closing price",
    },
    {
      key: "volume",
      apiPath: "timeSeries.5. volume",
      type: "number",
      sample: 0,
      description: "Trading volume",
    },
  ];

  return fetchWidgetData(url, defaultFields, widgetType);
};

export const getTimeIntervalData = async (
  symbol: string,
  interval: "daily" | "weekly" | "monthly",
  apiUrl?: string
): Promise<any> => {
  const baseUrl = apiUrl || "https://www.alphavantage.co/query?apikey=demo";
  let functionName = "TIME_SERIES_DAILY";

  switch (interval) {
    case "weekly":
      functionName = "TIME_SERIES_WEEKLY";
      break;
    case "monthly":
      functionName = "TIME_SERIES_MONTHLY";
      break;
  }

  const url = `${baseUrl}&function=${functionName}&symbol=${symbol}`;

  const defaultFields: ApiField[] = [
    {
      key: "open",
      apiPath: "timeSeries.1. open",
      type: "number",
      sample: 0,
      description: "Opening price",
    },
    {
      key: "high",
      apiPath: "timeSeries.2. high",
      type: "number",
      sample: 0,
      description: "High price",
    },
    {
      key: "low",
      apiPath: "timeSeries.3. low",
      type: "number",
      sample: 0,
      description: "Low price",
    },
    {
      key: "close",
      apiPath: "timeSeries.4. close",
      type: "number",
      sample: 0,
      description: "Closing price",
    },
    {
      key: "volume",
      apiPath: "timeSeries.5. volume",
      type: "number",
      sample: 0,
      description: "Trading volume",
    },
  ];

  return fetchWidgetData(url, defaultFields, "chart");
};
