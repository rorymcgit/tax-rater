import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { IncomeTaxCalculator } from './income-tax-calculator.service';
import { Breakdown, Tax } from './tax-breakdown.interface';
import { NationalInsuranceEmployeeCalculator } from './national-insurance-calculator.service';

type CalculationResult = {
  effectiveRate: number;
  headlineFigures: HeadlineFigure[];
  incomeTaxBreakdown: Breakdown[];
  nationalInsuranceBreakdown: Breakdown[];
};


interface HeadlineFigure {
  label: string;
  annual: number;
  month: number;
  week: number;
  day: number;
}


/*
  TODO
    * Add:
      - student loan
      - pension contributions
      - average spend VAT
      - average spend CGT
      - council tax
      - car tax
    * Add for other countries (comparison table)
 */
@Component({
  selector: 'app-root',
  standalone: true,
  providers: [IncomeTaxCalculator, NationalInsuranceEmployeeCalculator],
  imports: [RouterOutlet, ReactiveFormsModule, DecimalPipe], // ReactiveFormsModule added so component-level imports work without an NgModule
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public readonly title = 'Tax Calculator';
  public incomeTaxExpanded = false;
  public nationalInsuranceExpanded = false;
  private readonly incomeTaxCalculator = inject(IncomeTaxCalculator);
  private readonly nationalInsuranceCalculator = inject(NationalInsuranceEmployeeCalculator);

  public form = new FormGroup({
    // Store income as string (e.g. "12,345.67") in control for display. Parse when calculating
    income: new FormControl<string | null>(null)
  });

  public result: CalculationResult | null = null;

  public toggleNationalInsuranceExpanded(): void {
    this.incomeTaxExpanded = false;
    this.nationalInsuranceExpanded = !this.nationalInsuranceExpanded;
  }

  public toggleIncomeTaxExpanded(): void {
    this.nationalInsuranceExpanded = false;
    this.incomeTaxExpanded = !this.incomeTaxExpanded;
  }

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

  private getFigsByFrequency(fig: number): Omit<HeadlineFigure, 'label'> {
    return {
      annual: fig,
      month: fig / 12,
      week: fig / 52,
      day: fig / 252,
    }
  }

  private breakdownHeadlineFigures(income: number, incomeTax: number, nationalInsurance: number): HeadlineFigure[] {
    const incomeHeadline: HeadlineFigure = {
      label: 'Gross Income',
      ...this.getFigsByFrequency(income),
    };

    const incomeTaxHeadline: HeadlineFigure = {
      label: 'Income Tax',
      ...this.getFigsByFrequency(incomeTax),
    };

    const nationalInsuranceHeadline: HeadlineFigure = {
      label: 'National Insurance',
      ...this.getFigsByFrequency(nationalInsurance),
    };

    const takeHome = income - incomeTax - nationalInsurance;
    const takeHomeHeadline: HeadlineFigure = {
      label: 'Take Home',
      ...this.getFigsByFrequency(takeHome)
    }


    return [
      incomeHeadline,
      incomeTaxHeadline,
      nationalInsuranceHeadline,
      takeHomeHeadline,
    ];
  }

  public calculate(): void {
    const income = this.getIncome();
    if (income === 0) {
      return;
    }

    const incomeTax = this.incomeTaxCalculator.calculate(income);
    const nationalInsurance = this.nationalInsuranceCalculator.calculate(income);

    const effectiveRate = (incomeTax.tax + nationalInsurance.tax) / income * 100;

    this.result = {
      effectiveRate,
      headlineFigures: this.breakdownHeadlineFigures(income, incomeTax.tax, nationalInsurance.tax),
      incomeTaxBreakdown: incomeTax.breakdown,
      nationalInsuranceBreakdown: nationalInsurance.breakdown,
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
