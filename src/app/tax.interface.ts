import { Breakdown } from './breakdown.interface';

export interface Tax {
  tax: number;
  breakdown: Breakdown[];
}
