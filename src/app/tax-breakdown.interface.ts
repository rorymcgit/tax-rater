export interface Tax {
  tax: number;
  breakdown: Breakdown[];
}

export interface Breakdown {
  band: string;
  taxable: number;
  tax: number;
}
