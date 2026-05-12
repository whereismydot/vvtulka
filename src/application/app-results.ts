export type StatusTone = 'info' | 'success' | 'warning' | 'error';

export interface AppActionResult {
  readonly changed: boolean;
  readonly tone: StatusTone;
  readonly message: string;
}

export interface AddOrderResult extends AppActionResult {
  readonly orderAdded: boolean;
  readonly warningsCount: number;
}
