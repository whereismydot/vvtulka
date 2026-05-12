export type DecimalRaw = string;

export interface OrderItem {
  readonly name: string;
  readonly quantityRaw: DecimalRaw;
  readonly sumRaw: DecimalRaw;
  readonly isVkusbackEligible: boolean;
  readonly sourceRow: number;
}

export interface Order {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly items: readonly OrderItem[];
  readonly vkusbackSumRaw: DecimalRaw;
  readonly rawInput: string;
}

export interface Metrics {
  readonly ordersCount: number;
  readonly vkusbackTotalRaw: DecimalRaw;
  readonly percentRaw: DecimalRaw;
  readonly cashbackRaw: DecimalRaw;
}

export interface ParseResult {
  readonly items: readonly OrderItem[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface StorageState {
  readonly version: number;
  readonly orders: readonly Order[];
  readonly percentRaw: DecimalRaw;
  readonly updatedAt: string;
}
