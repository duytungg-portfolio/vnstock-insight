export interface StockInfo {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export interface SectorMetric {
  name: string;
  currentValue: number;
  impact: "positive" | "negative" | "neutral";
  explanation: string;
  source: string;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DashboardData {
  stockInfo: StockInfo;
  sectorMetrics: SectorMetric[];
  aiInsight: string;
  priceHistory: PricePoint[];
}
