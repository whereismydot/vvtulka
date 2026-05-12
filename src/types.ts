export type DecimalRaw = string;

export interface OrderItem {
  name: string;
  quantityRaw: DecimalRaw;
  sumRaw: DecimalRaw;
  isVkusbackEligible: boolean;
  sourceRow: number;
}

export interface Order {
  id: string;
  title: string;
  createdAt: string;
  items: OrderItem[];
  vkusbackSumRaw: DecimalRaw;
  rawInput: string;
}

export interface Metrics {
  ordersCount: number;
  vkusbackTotalRaw: DecimalRaw;
  percentRaw: DecimalRaw;
  cashbackRaw: DecimalRaw;
}

export interface ParseResult {
  items: OrderItem[];
  warnings: string[];
  errors: string[];
}

export interface StorageState {
  version: number;
  orders: Order[];
  percentRaw: DecimalRaw;
  updatedAt: string;
}
