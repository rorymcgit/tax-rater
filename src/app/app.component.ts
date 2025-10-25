import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, DecimalPipe], // ReactiveFormsModule added so component-level imports work without an NgModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Effective Tax Rate Calculator';

  // Reactive form for income input (currency)
  form = new FormGroup({
    income: new FormControl<number | null>(null)
  });

  // UK tax bands (2023/24-like values provided in the task)
  private bands = [
    { name: 'Personal Allowance', lower: 0, upper: 12570, rate: 0 },
    { name: 'Basic rate', lower: 12570, upper: 50270, rate: 0.20 },
    { name: 'Higher rate', lower: 50270, upper: 125140, rate: 0.40 },
    { name: 'Additional rate', lower: 125140, upper: Infinity, rate: 0.45 }
  ];

  public result: {
    income: number;
    tax: number;
    effectiveRate: number; // 0-100
    breakdown: Array<{ band: string; taxedAt: number; tax: number }>;
  } | null = null;

  public calculate(): void {
    const income = Number(this.form.get('income')?.value) || 0;
    const breakdown: Array<{ band: string; taxedAt: number; tax: number }> = [];
    let tax = 0;

    for (const b of this.bands) {
      const bandLower = b.lower;
      const bandUpper = b.upper === Infinity ? Infinity : b.upper;

      const taxableInBand = Math.max(0, Math.min(income, bandUpper) - bandLower);
      const bandTax = taxableInBand * b.rate;
      if (taxableInBand > 0) {
        breakdown.push({ band: b.name, taxedAt: taxableInBand, tax: bandTax });
        tax += bandTax;
      }

      if (income <= bandUpper) {
        break
      }
    }

    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;

    this.result = {
      income,
      tax: Math.round(tax * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      breakdown
    };
  }
}
