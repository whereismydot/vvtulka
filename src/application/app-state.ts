import type { DecimalRaw, Order } from '../domain/types';

export interface AppState {
  readonly orders: readonly Order[];
  readonly percentRaw: DecimalRaw;
}
