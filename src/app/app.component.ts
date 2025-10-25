import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

interface Breakdown {
  band: string;
  taxedAt: number;
  tax: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, DecimalPipe], // ReactiveFormsModule added so component-level imports work without an NgModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public readonly title = 'Effective Tax Rate Calculator';

  public form = new FormGroup({
    // Store income as string like "12,345.67" in the control for display; parse when calculating
    income: new FormControl<string | null>(null)
  });

  public formatIncomeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';
    const formatted = this.formatWithCommas(raw);

    this.form.get('income')?.setValue(formatted, { emitEvent: false });

    // Update the native input if formatting changed (keeps caret simple by moving to end)
    if (input.value !== formatted) {
      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
    }
  }

  // UK tax bands (2025/2026 FY)
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
    breakdown: Breakdown[];
  } | null = null;

  public calculate(): void {
    const income = this.getIncome();
    const breakdown: Breakdown[] = [];
    let tax = 0;

    const fullAllowance = this.bands[0].upper; // 12,570
    let personalAllowance = fullAllowance;
    if (income > 100_000) {
      const reduction = Math.floor((income - 100_000) / 2);
      personalAllowance = Math.max(0, fullAllowance - reduction);
    }

    // Add Personal Allowance band (0%): show how much of income sits in the allowance
    const paUsed = Math.min(income, personalAllowance);
    if (paUsed > 0) {
      breakdown.push({ band: 'Personal Allowance', taxedAt: paUsed, tax: 0 });
    }

    // Taxable income after allowance
    let remainingTaxable = Math.max(0, income - personalAllowance);

    for (const b of this.bands) {
      const width = b.upper === Infinity ? Infinity : b.upper - b.lower;
      const taxedAt = Math.max(0, Math.min(remainingTaxable, width));
      const bandTax = taxedAt * b.rate;

      if (taxedAt > 0) {
        breakdown.push({ band: b.name, taxedAt, tax: bandTax });
        tax += bandTax;
        remainingTaxable -= taxedAt;
      }

      if (remainingTaxable <= 0) {
        break;
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

  /** Format a numeric string with commas for thousands while preserving decimals */
  private formatWithCommas(value: string): string {
    if (!value) {
      return '';
    }

    // Remove anything except digits and dot
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let intPart = parts[0];

    // Strip leading zeros unless the value is exactly '0' or starts with '0.'
    // Keep as-is so users can type '0.'
    intPart = intPart.replace(/^0+(?=\d)/, '');

    // Add commas
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (parts.length > 1) {
      // keep only first decimal part up to 2-3 places? we just preserve what user types
      const frac = parts[1].replace(/[^0-9]/g, '');
      return intPart + '.' + frac;
    }
    return intPart;
  }

  private getIncome(): number {
    // Strip commas and any stray characters from string currency input
    const raw = this.form.get('income')?.value || '';
    const numericString = String(raw).replace(/,/g, '').replace(/[^0-9.]/g, '');
    return Number(numericString) || 0;
  }
}
