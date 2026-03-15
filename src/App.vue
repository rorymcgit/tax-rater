<script setup lang="ts">
import { ref, computed } from "vue";
import { calculateIncomeTax } from "./calculators/income-tax";
import type { Region } from "./calculators/income-tax";
import { calculateNationalInsurance } from "./calculators/national-insurance";
import { calculateEmployerNationalInsurance } from "./calculators/employer-national-insurance";
import { calculateSelfEmployedNI } from "./calculators/national-insurance-self-employed";
import type { SelfEmployedNI } from "./calculators/national-insurance-self-employed";
import { calculateStudentLoan } from "./calculators/student-loan";
import type { StudentLoanPlan } from "./calculators/student-loan";
import { calculateDividendTax } from "./calculators/dividend-tax";
import type { Breakdown } from "./types/tax";

type Frequency = "annual" | "monthly" | "weekly";
type EmploymentType = "employed" | "self-employed";

interface HeadlineFigure {
  label: string;
  annual: number;
  month: number;
  week: number;
  day: number;
}

interface CalculationResult {
  effectiveRate: number;
  headlineFigures: HeadlineFigure[];
  incomeTaxBreakdown: Breakdown[];
  nicBreakdown: Breakdown[];
  dividendTax: number;
  dividendTaxBreakdown: Breakdown[];
}

type PensionType = "none" | "salary-sacrifice" | "relief-at-source";
type PensionMode = "percent" | "amount";

const title = "Tax Calculator";
const income = ref("");
const region = ref<Region>("england");
const frequency = ref<Frequency>("annual");
const employmentType = ref<EmploymentType>("employed");
const pensionType = ref<PensionType>("none");
const pensionMode = ref<PensionMode>("percent");
const pensionInput = ref("");
const studentLoanPlan = ref<StudentLoanPlan>("none");
const dividendIncome = ref("");
const showEmployerNICs = ref(false);
const incomeTaxExpanded = ref(false);
const nationalInsuranceExpanded = ref(false);
const dividendTaxExpanded = ref(false);

function getPensionAmount(annualGross: number): number {
  if (pensionType.value === "none") return 0;
  const val = Number(pensionInput.value) || 0;
  const amount =
    pensionMode.value === "percent" ? annualGross * (val / 100) : val;
  return Math.min(amount, annualGross);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toggleNationalInsuranceExpanded(): void {
  incomeTaxExpanded.value = false;
  dividendTaxExpanded.value = false;
  nationalInsuranceExpanded.value = !nationalInsuranceExpanded.value;
}

function toggleIncomeTaxExpanded(): void {
  nationalInsuranceExpanded.value = false;
  dividendTaxExpanded.value = false;
  incomeTaxExpanded.value = !incomeTaxExpanded.value;
}

function toggleDividendTaxExpanded(): void {
  incomeTaxExpanded.value = false;
  nationalInsuranceExpanded.value = false;
  dividendTaxExpanded.value = !dividendTaxExpanded.value;
}

function getDividendIncome(): number {
  const raw = dividendIncome.value || "";
  return Number(raw.replace(/,/g, "").replace(/[^0-9.]/g, "")) || 0;
}

function formatDividendInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const formatted = formatWithCommas(input.value || "");
  dividendIncome.value = formatted;
  if (input.value !== formatted) {
    input.value = formatted;
    input.setSelectionRange(formatted.length, formatted.length);
  }
}

function formatIncomeInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const raw = input.value || "";
  const formatted = formatWithCommas(raw);

  income.value = formatted;

  // Update the native input if formatting changed (keeps caret simple by moving to end)
  if (input.value !== formatted) {
    input.value = formatted;
    input.setSelectionRange(formatted.length, formatted.length);
  }
}

function getFigsByFrequency(fig: number): Omit<HeadlineFigure, "label"> {
  return {
    annual: fig,
    month: fig / 12,
    week: fig / 52,
    day: fig / 252,
  };
}

function breakdownHeadlineFigures(
  incomeVal: number,
  incomeTax: number,
  nationalInsurance: number,
  pensionAmount = 0,
  studentLoanRepayment = 0,
  nicLabel = "National Insurance",
  dividendTax = 0,
): HeadlineFigure[] {
  const figures: HeadlineFigure[] = [
    { label: "Gross Income", ...getFigsByFrequency(incomeVal) },
  ];

  if (pensionAmount > 0) {
    figures.push({ label: "Pension", ...getFigsByFrequency(pensionAmount) });
  }

  figures.push(
    { label: "Income Tax", ...getFigsByFrequency(incomeTax) },
    { label: nicLabel, ...getFigsByFrequency(nationalInsurance) },
  );

  if (studentLoanRepayment > 0) {
    figures.push({
      label: "Student Loan",
      ...getFigsByFrequency(studentLoanRepayment),
    });
  }

  if (dividendTax > 0) {
    figures.push({ label: "Dividend Tax", ...getFigsByFrequency(dividendTax) });
  }

  figures.push({
    label: "Take Home",
    ...getFigsByFrequency(
      incomeVal -
        pensionAmount -
        incomeTax -
        nationalInsurance -
        studentLoanRepayment -
        dividendTax,
    ),
  });

  return figures;
}

function toAnnual(value: number, freq: Frequency): number {
  if (freq === "monthly") return value * 12;
  if (freq === "weekly") return value * 52;
  return value;
}

const incomePlaceholder = computed<string>(() => {
  if (employmentType.value === 'self-employed') {
    return 'Enter annual profit...'
  }
  return `Enter ${frequency.value} income...`
})

const result = computed<CalculationResult | null>(() => {
  const inputIncome = getIncome();
  if (inputIncome === 0) return null;

  const annualGross = toAnnual(inputIncome, frequency.value);
  const pensionAmount = getPensionAmount(annualGross);

  // Salary sacrifice reduces income before both tax and NICs.
  // Personal/relief-at-source reduces taxable income only; NICs use full gross.
  const taxableIncome = annualGross - pensionAmount;
  const nicIncome =
    pensionType.value === "salary-sacrifice" ? taxableIncome : annualGross;

  const incomeTax = calculateIncomeTax(taxableIncome, region.value);
  const dividendIncomeVal = getDividendIncome();
  const dividend = calculateDividendTax(dividendIncomeVal, annualGross);
  const totalIncome = annualGross + dividendIncomeVal;

  if (employmentType.value === "self-employed") {
    const selfEmployedNI: SelfEmployedNI = calculateSelfEmployedNI(taxableIncome);
    const studentLoanRepayment = calculateStudentLoan(annualGross, studentLoanPlan.value);
    const effectiveRate = (incomeTax.tax + selfEmployedNI.total + dividend.tax) / totalIncome * 100;

    return {
      effectiveRate,
      headlineFigures: breakdownHeadlineFigures(
        totalIncome,
        incomeTax.tax,
        selfEmployedNI.total,
        pensionAmount,
        studentLoanRepayment,
        "National Insurance (Self-Employed)",
        dividend.tax,
      ),
      incomeTaxBreakdown: incomeTax.breakdown,
      nicBreakdown: selfEmployedNI.breakdown,
      dividendTax: dividend.tax,
      dividendTaxBreakdown: dividend.breakdown,
    };
  }

  const nationalInsurance = calculateNationalInsurance(nicIncome);
  const studentLoanRepayment = calculateStudentLoan(annualGross, studentLoanPlan.value);

  // TODO change to effective TAKE HOME rate, i.e. invert and include pension, student loan + employer NICS
  // Be explicit in the UI about what this shows and show the formula
  const effectiveRate = (incomeTax.tax + nationalInsurance.tax + dividend.tax) / totalIncome * 100;

  return {
    effectiveRate,
    headlineFigures: breakdownHeadlineFigures(
      totalIncome,
      incomeTax.tax,
      nationalInsurance.tax,
      pensionAmount,
      studentLoanRepayment,
      "National Insurance",
      dividend.tax,
    ),
    incomeTaxBreakdown: incomeTax.breakdown,
    nicBreakdown: nationalInsurance.breakdown,
    dividendTax: dividend.tax,
    dividendTaxBreakdown: dividend.breakdown,
  };
});

const employerNICs = computed(() => {
  if (!showEmployerNICs.value || employmentType.value === "self-employed") return null;
  const inputIncome = getIncome();
  if (inputIncome === 0) return null;
  const annualGross = toAnnual(inputIncome, frequency.value);
  const pensionAmount = getPensionAmount(annualGross);
  const nicIncome = pensionType.value === "salary-sacrifice" ? annualGross - pensionAmount : annualGross;
  return calculateEmployerNationalInsurance(nicIncome);
});

function formatWithCommas(value: string): string {
  if (!value) {
    return "";
  }

  // Remove anything except digits and dot
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  let intPart = parts[0];

  // Strip leading zeros unless the value is exactly '0' or starts with '0.'
  intPart = intPart.replace(/^0+(?=\d)/, "");

  // Add commas
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (parts.length > 1) {
    const frac = parts[1].replace(/[^0-9]/g, "");
    return intPart + "." + frac;
  }
  return intPart;
}

function getIncome(): number {
  const raw = income.value || "";
  const numericString = String(raw)
    .replace(/,/g, "")
    .replace(/[^0-9.]/g, "");
  return Number(numericString) || 0;
}
</script>

<template>
  <main class="main">
    <div class="content-container">
      <div class="content">
        <h1>{{ title }}</h1>

        <div class="form-element">
          <label>Employment: </label>
          <div class="input-row">
            <label class="radio-label">
              <input type="radio" v-model="employmentType" value="employed" /> Employed
            </label>
            <label class="radio-label">
              <input type="radio" v-model="employmentType" value="self-employed" /> Self-employed
            </label>
          </div>
        </div>

        <div class="form-element">
          <label for="region-select">Region: </label>
          <select v-model="region" id="region-select">
            <option value="england">England, Wales &amp; NI</option>
            <option value="scotland">Scotland</option>
          </select>
        </div>

        <div class="form-element">
          <label for="income">Income: </label>
          <div class="input-row">
            <span>£</span>
            <input
              id="income"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :value="income"
              :placeholder="incomePlaceholder"
              @input="formatIncomeInput"
            />
            <select v-model="frequency" aria-label="Income frequency">
              <option value="annual">/ year</option>
              <option value="monthly">/ month</option>
              <option value="weekly">/ week</option>
            </select>
          </div>
        </div>

        <div class="form-element">
          <label for="dividend-income">Dividends: </label>
          <div class="input-row">
            <span>£</span>
            <input
              id="dividend-income"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :value="dividendIncome"
              placeholder="Enter annual dividends..."
              @input="formatDividendInput"
            />
          </div>
        </div>

        <div class="form-element">
          <label for="pension-type">Pension: </label>
          <select v-model="pensionType" id="pension-type">
            <option value="none">None</option>
            <option value="salary-sacrifice">Salary Sacrifice</option>
            <option value="relief-at-source">
              Personal / Relief at Source
            </option>
          </select>
        </div>

        <div v-if="pensionType !== 'none'" class="form-element">
          <label for="pension-amount">Amount: </label>
          <div class="input-row">
            <span v-if="pensionMode === 'amount'">£</span>
            <input
              id="pension-amount"
              type="number"
              inputmode="decimal"
              min="0"
              :max="pensionMode === 'percent' ? 100 : undefined"
              step="0.01"
              v-model="pensionInput"
              placeholder="0"
            />
            <select
              v-model="pensionMode"
              aria-label="Pension contribution unit"
            >
              <option value="percent">%</option>
              <option value="amount">£</option>
            </select>
          </div>
        </div>

        <div class="form-element">
          <label for="student-loan-plan">Student Loan: </label>
          <select v-model="studentLoanPlan" id="student-loan-plan">
            <option value="none">None</option>
            <option value="plan1">Plan 1</option>
            <option value="plan2">Plan 2</option>
            <option value="plan4">Plan 4 (Scotland)</option>
            <option value="plan5">Plan 5</option>
            <option value="postgraduate">Postgraduate</option>
          </select>
        </div>

        <div v-if="employmentType === 'employed'" class="form-element">
          <label for="show-employer-nics">Employer NICs: </label>
          <input type="checkbox" id="show-employer-nics" v-model="showEmployerNICs" />
        </div>

        <section class="calculator-section">
          <div v-if="result" class="result-box">
            <div class="table-wrap">
              <table class="calculator-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Annually</th>
                    <th>Monthly</th>
                    <th>Weekly</th>
                    <th>Daily</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fig in result.headlineFigures" :key="fig.label">
                    <td>
                      <button
                        v-if="fig.label === 'Income Tax'"
                        class="inline-summary"
                        type="button"
                        @click="toggleIncomeTaxExpanded"
                      >
                        <span class="arrow">{{
                          incomeTaxExpanded ? "▾" : "▸"
                        }}</span>
                        {{ fig.label }}
                      </button>
                      <button
                        v-else-if="fig.label.startsWith('National Insurance')"
                        class="inline-summary"
                        type="button"
                        @click="toggleNationalInsuranceExpanded"
                      >
                        <span class="arrow">{{
                          nationalInsuranceExpanded ? "▾" : "▸"
                        }}</span>
                        {{ fig.label }}
                      </button>
                      <button
                        v-else-if="fig.label === 'Dividend Tax'"
                        class="inline-summary"
                        type="button"
                        @click="toggleDividendTaxExpanded"
                      >
                        <span class="arrow">{{
                          dividendTaxExpanded ? "▾" : "▸"
                        }}</span>
                        {{ fig.label }}
                      </button>
                      <template v-else>
                        {{ fig.label }}
                      </template>
                    </td>
                    <td>£{{ formatCurrency(fig.annual) }}</td>
                    <td>£{{ formatCurrency(fig.month) }}</td>
                    <td>£{{ formatCurrency(fig.week) }}</td>
                    <td>£{{ formatCurrency(fig.day) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 class="effective-rate">
              Effective Tax Rate: {{ formatCurrency(result.effectiveRate) }}%
            </h3>

            <div v-if="incomeTaxExpanded" class="full-width-breakdown">
              <h3>Income Tax - Breakdown by Band</h3>
              <div class="table-wrap">
                <table class="calculator-table">
                  <thead>
                    <tr>
                      <th>Band</th>
                      <th>Taxable Amount</th>
                      <th>Tax Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in result.incomeTaxBreakdown" :key="b.band">
                      <td>{{ b.band }}</td>
                      <td>£{{ formatCurrency(b.taxable) }}</td>
                      <td>£{{ formatCurrency(b.tax) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <template v-else-if="nationalInsuranceExpanded">
              <h3>National Insurance - Breakdown by Band</h3>
              <div class="table-wrap">
                <table class="calculator-table">
                  <thead>
                    <tr>
                      <th>Band</th>
                      <th>Taxable Amount</th>
                      <th>Tax Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in result.nicBreakdown" :key="b.band">
                      <td>{{ b.band }}</td>
                      <td>£{{ formatCurrency(b.taxable) }}</td>
                      <td>£{{ formatCurrency(b.tax) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <template v-else-if="dividendTaxExpanded">
              <h3>Dividend Tax - Breakdown by Band</h3>
              <div class="table-wrap">
                <table class="calculator-table">
                  <thead>
                    <tr>
                      <th>Band</th>
                      <th>Taxable Amount</th>
                      <th>Tax Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in result.dividendTaxBreakdown" :key="b.band">
                      <td>{{ b.band }}</td>
                      <td>£{{ formatCurrency(b.taxable) }}</td>
                      <td>£{{ formatCurrency(b.tax) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </section>

        <section v-if="employerNICs" class="calculator-section">
          <div class="result-box employer-cost-box">
            <h3 class="employer-cost-label">Employer Cost (not your deduction)</h3>
            <div class="table-wrap">
              <table class="calculator-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Annually</th>
                    <th>Monthly</th>
                    <th>Weekly</th>
                    <th>Daily</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Employer NICs</td>
                    <td>£{{ formatCurrency(employerNICs.tax) }}</td>
                    <td>£{{ formatCurrency(employerNICs.tax / 12) }}</td>
                    <td>£{{ formatCurrency(employerNICs.tax / 52) }}</td>
                    <td>£{{ formatCurrency(employerNICs.tax / 252) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
$bright-blue: oklch(51.01% 0.274 263.83);
$electric-violet: oklch(53.18% 0.28 296.97);
$french-violet: oklch(47.66% 0.246 305.88);
$vivid-pink: oklch(69.02% 0.277 332.77);
$hot-red: oklch(61.42% 0.238 15.34);
$orange-red: oklch(63.32% 0.24 31.68);

$gray-900: oklch(19.37% 0.006 300.98);
$gray-700: oklch(36.98% 0.014 302.71);
$gray-400: oklch(70.9% 0.015 304.04);

$red-to-pink-to-purple-vertical-gradient: linear-gradient(
  180deg,
  $orange-red 0%,
  $vivid-pink 50%,
  $electric-violet 100%
);

$red-to-pink-to-purple-horizontal-gradient: linear-gradient(
  90deg,
  $orange-red 0%,
  $vivid-pink 50%,
  $electric-violet 100%
);

h1 {
  font-size: 3.125rem;
  font-weight: 500;
  line-height: 100%;
  letter-spacing: -0.125rem;
  text-align: center;
}

p {
  color: $gray-700;
}

main {
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  box-sizing: inherit;
  position: relative;
}

.content-container {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 3rem;
}

.content h1 {
  margin-top: 1.75rem;
}

.content p {
  margin-top: 1.5rem;
}

.content {
  width: 900px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.divider {
  width: 1px;
  background: $red-to-pink-to-purple-vertical-gradient;
  margin-inline: 0.5rem;
}

form .button-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.form-element {
  width: 400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.effective-rate {
  color: #d8f24e;
  text-align: center;
}

@media screen and (max-width: 650px) {
  .divider {
    height: 1px;
    width: 100%;
    background: $red-to-pink-to-purple-horizontal-gradient;
    margin-block: 1.5rem;
  }
}

.calculator-section {
  margin-top: 1.25rem;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.result-box {
  margin-top: 1rem;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.table-wrap {
  overflow: auto;
  margin-top: 0.5rem;
}

.headline-figs span {
  font-weight: bold;
}

table.calculator-table {
  width: 100%;
  border-collapse: collapse;
}

table.calculator-table th,
table.calculator-table td {
  padding: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.inline-details {
  display: block;
}

.inline-summary {
  list-style: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  font-weight: 600;
  color: #e2e0e0;
  background: transparent;
  border: 0;
  font: inherit;
}

.inline-summary .arrow {
  display: inline-block;
  transition: transform 0.15s ease;
}

.inline-details[open] .inline-summary .arrow {
  transform: rotate(90deg);
}

.breakdown-inline {
  margin-top: 0.5rem;
}

.full-width-breakdown {
  margin-top: 0.75rem;
  width: 100%;
}

.full-width-breakdown h4 {
  margin: 0 0 0.5rem 0;
}

table.calculator-table th {
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.employer-cost-box {
  border-color: #444;
}

.employer-cost-label {
  color: $gray-400;
  text-align: center;
  margin-top: 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
}
</style>
