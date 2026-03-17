<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";
import { calculateIncomeTax } from "./calculators/income-tax";
import type { Region } from "./calculators/income-tax";
import { calculateNationalInsurance } from "./calculators/national-insurance";
import { calculateEmployerNationalInsurance } from "./calculators/employer-national-insurance";
import type { EmployerNICCategory } from "./calculators/employer-national-insurance";
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

interface IncomeBarSegment {
  label: string;
  pct: number;
  colour: string;
}

type PensionType = "none" | "salary-sacrifice" | "relief-at-source";
type PensionMode = "percent" | "amount";

const INCOME_BAR_COLOURS: Record<string, string> = {
  Pension: "#5bc0eb",
  "Income Tax": "#e8563a",
  "National Insurance": "#9b5de5",
  "National Insurance (Self-Employed)": "#9b5de5",
  "Student Loan": "#00bbf9",
  "Dividend Tax": "#f5a623",
  "Take Home": "#d8f24e",
};

// Theme
const isDark = ref(
  localStorage.getItem("theme")
    ? localStorage.getItem("theme") === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches,
);
watchEffect(() => {
  document.documentElement.classList.toggle("light", !isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
});
function toggleTheme(): void { isDark.value = !isDark.value; }

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
const employerNICCategory = ref<EmployerNICCategory>("A");
const incomeTaxExpanded = ref(false);
const nationalInsuranceExpanded = ref(false);
const dividendTaxExpanded = ref(false);
const mobileFreqTab = ref<"annual" | "monthly" | "weekly" | "daily">("annual");

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
  return calculateEmployerNationalInsurance(nicIncome, employerNICCategory.value);
});

const incomeBar = computed<IncomeBarSegment[]>(() => {
  if (!result.value) return [];
  const gross = result.value.headlineFigures[0]?.annual ?? 0;
  if (gross === 0) return [];
  return result.value.headlineFigures
    .filter((f) => f.label !== "Gross Income")
    .map((f) => ({
      label: f.label,
      pct: (f.annual / gross) * 100,
      colour: INCOME_BAR_COLOURS[f.label] ?? "#888",
    }));
});

const annualGross = computed(() => toAnnual(getIncome(), frequency.value));

const takeHomeAnnual = computed(
  () => result.value?.headlineFigures.find((f) => f.label === "Take Home")?.annual ?? null,
);

const sliderValue = computed(() => getIncome());

function onSliderChange(e: Event): void {
  income.value = formatWithCommas(String(Number((e.target as HTMLInputElement).value)));
}

function formatPounds(value: number): string {
  return "£" + Math.round(value).toLocaleString("en-GB");
}

const nextBandMessage = computed<string | null>(() => {
  const gross = annualGross.value;
  if (gross <= 0 || gross >= 125_140) return null;

  if (region.value === "scotland") {
    if (gross < 12_570) return `${formatPounds(12_570 - gross)} until Starter Rate (19%)`;
    if (gross < 15_397) return `${formatPounds(15_397 - gross)} until Basic Rate (20%)`;
    if (gross < 27_491) return `${formatPounds(27_491 - gross)} until Intermediate Rate (21%)`;
    if (gross < 43_662) return `${formatPounds(43_662 - gross)} until Higher Rate (42%)`;
    if (gross < 75_000) return `${formatPounds(75_000 - gross)} until Advanced Rate (45%)`;
    if (gross < 100_000) return `${formatPounds(100_000 - gross)} until Personal Allowance taper`;
    return null;
  }

  if (gross < 12_570) return `${formatPounds(12_570 - gross)} until Basic Rate (20%)`;
  if (gross < 50_270) return `${formatPounds(50_270 - gross)} until Higher Rate (40%)`;
  if (gross < 100_000) return `${formatPounds(100_000 - gross)} until Personal Allowance taper`;
  return null;
});

const showTaperWarning = computed(
  () => annualGross.value > 100_000 && annualGross.value < 125_140,
);

interface MarginalRate {
  total: number;
  itRate: number;
  niRate: number;
  nicLabel: string;
  isTaper: boolean;
}

const marginalRate = computed<MarginalRate | null>(() => {
  const gross = annualGross.value;
  if (gross <= 0) return null;

  let itRate: number;
  let isTaper = false;

  if (region.value === "scotland") {
    if (gross <= 12_570) itRate = 0;
    else if (gross <= 15_397) itRate = 19;
    else if (gross <= 27_491) itRate = 20;
    else if (gross <= 43_662) itRate = 21;
    else if (gross <= 75_000) itRate = 42;
    else if (gross <= 100_000) itRate = 45;
    else if (gross <= 125_140) { itRate = 68; isTaper = true; }
    else itRate = 48;
  } else {
    if (gross <= 12_570) itRate = 0;
    else if (gross <= 50_270) itRate = 20;
    else if (gross <= 100_000) itRate = 40;
    else if (gross <= 125_140) { itRate = 60; isTaper = true; }
    else itRate = 45;
  }

  let niRate: number;
  let nicLabel: string;

  if (employmentType.value === "self-employed") {
    nicLabel = "Class 4 NI";
    if (gross <= 12_570) niRate = 0;
    else if (gross <= 50_270) niRate = 6;
    else niRate = 2;
  } else {
    nicLabel = "NI";
    if (gross <= 12_584) niRate = 0;
    else if (gross <= 50_284) niRate = 8;
    else niRate = 2;
  }

  return { total: itRate + niRate, itRate, niRate, nicLabel, isTaper };
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

// Shareable URL
const shareMessage = ref<string | null>(null);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("income")) income.value = formatWithCommas(params.get("income")!);
  if (params.get("region")) region.value = params.get("region") as Region;
  if (params.get("freq")) frequency.value = params.get("freq") as Frequency;
  if (params.get("employment")) employmentType.value = params.get("employment") as EmploymentType;
  if (params.get("pension")) pensionType.value = params.get("pension") as PensionType;
  if (params.get("pensionMode")) pensionMode.value = params.get("pensionMode") as PensionMode;
  if (params.get("pensionInput")) pensionInput.value = params.get("pensionInput")!;
  if (params.get("loan")) studentLoanPlan.value = params.get("loan") as StudentLoanPlan;
  if (params.get("dividends")) dividendIncome.value = formatWithCommas(params.get("dividends")!);
});

function getShareableUrl(): string {
  const params = new URLSearchParams();
  if (income.value) params.set("income", getIncome().toString());
  if (region.value !== "england") params.set("region", region.value);
  if (frequency.value !== "annual") params.set("freq", frequency.value);
  if (employmentType.value !== "employed") params.set("employment", employmentType.value);
  if (pensionType.value !== "none") params.set("pension", pensionType.value);
  if (pensionType.value !== "none" && pensionMode.value !== "percent") params.set("pensionMode", pensionMode.value);
  if (pensionType.value !== "none" && pensionInput.value) params.set("pensionInput", pensionInput.value);
  if (studentLoanPlan.value !== "none") params.set("loan", studentLoanPlan.value);
  if (dividendIncome.value) params.set("dividends", getDividendIncome().toString());
  const qs = params.toString();
  return window.location.origin + window.location.pathname + (qs ? "?" + qs : "");
}

async function copyShareUrl(): Promise<void> {
  await navigator.clipboard.writeText(getShareableUrl());
  shareMessage.value = "Copied!";
  setTimeout(() => { shareMessage.value = null; }, 2000);
}
</script>

<template>
  <main class="main">
    <div class="app-layout">
      <div class="form-panel">
        <div class="theme-toggle-row">
          <button class="theme-toggle" @click="toggleTheme" :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            {{ isDark ? '☀' : '☾' }}
          </button>
        </div>
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

        <div class="form-element income-form-element">
          <label for="income">Income: </label>
          <div class="income-input-group">
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
            <input
              type="range"
              min="0"
              max="300000"
              step="500"
              :value="sliderValue"
              @input="onSliderChange"
              class="income-slider"
              aria-label="Income slider"
            />
          </div>
        </div>

        <div v-if="nextBandMessage" class="band-nudge">{{ nextBandMessage }}</div>

        <div v-if="showTaperWarning" class="taper-warning">
          <strong>Personal Allowance taper zone</strong> — you lose £1 of your Personal Allowance for every £2 earned above £100,000, creating an effective <strong>60–62% marginal rate</strong> until £125,140.
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
          <label for="pension-type">
            Pension
            <span class="tooltip-wrap">
              <span class="info-icon">ⓘ</span>
              <span class="tooltip-text">
                <strong>Salary Sacrifice:</strong> contributions come out before tax and NI — you save both.<br><br>
                <strong>Personal / Relief at Source:</strong> contributions come from post-tax pay; HMRC adds 20% basic rate relief automatically.
              </span>
            </span>:
          </label>
          <select v-model="pensionType" id="pension-type">
            <option value="none">None</option>
            <option value="salary-sacrifice">Salary Sacrifice</option>
            <option value="relief-at-source">
              Personal / Relief at Source
            </option>
          </select>
        </div>

        <div v-if="pensionType !== 'none'" class="form-element">
          <label for="pension-amount">Pension Contribution: </label>
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

        <div v-if="showEmployerNICs && employmentType === 'employed'" class="form-element">
          <label for="employer-nic-category">NIC Category: </label>
          <select v-model="employerNICCategory" id="employer-nic-category">
            <option value="A">A — Standard</option>
            <option value="B">B — Married women / widows reduced rate</option>
            <option value="C">C — State pension age or over</option>
            <option value="D">D — Contracted-out salary related</option>
            <option value="E">E — Contracted-out salary related (reduced)</option>
            <option value="F">F — Contracted-out money purchase</option>
            <option value="H">H — Apprentice under 25</option>
            <option value="I">I — Contracted-out money purchase (reduced)</option>
            <option value="J">J — Deferred NIC</option>
            <option value="K">K — Contracted-out salary related (deferred)</option>
            <option value="L">L — Contracted-out money purchase (deferred)</option>
            <option value="M">M — Under 21</option>
            <option value="N">N — Under 21 (deferred)</option>
            <option value="S">S — Scottish taxpayer, deferred</option>
            <option value="V">V — Veteran, first year of civilian employment</option>
            <option value="Z">Z — Under 21, deferred NIC</option>
          </select>
        </div>
      </div>

      <div class="results-panel">
        <div v-if="incomeBar.length" class="income-bar-wrap">
          <div class="income-bar">
            <div
              v-for="seg in incomeBar"
              :key="seg.label"
              class="income-bar-segment"
              :style="{ width: seg.pct + '%', background: seg.colour }"
            ></div>
          </div>
          <div class="income-bar-legend">
            <div v-for="seg in incomeBar" :key="seg.label" class="legend-item">
              <span class="legend-dot" :style="{ background: seg.colour }"></span>
              <span class="legend-label">{{ seg.label }}</span>
            </div>
          </div>
        </div>

        <section class="calculator-section">
          <Transition name="fade">
          <div v-if="result" class="result-box">
            <div class="freq-tabs">
              <button
                v-for="tab in (['annual', 'monthly', 'weekly', 'daily'] as const)"
                :key="tab"
                :class="['freq-tab', { active: mobileFreqTab === tab }]"
                @click="mobileFreqTab = tab"
              >{{ tab.charAt(0).toUpperCase() + tab.slice(1) }}</button>
            </div>
            <div class="table-wrap" :class="`freq-${mobileFreqTab}`">
              <table class="calculator-table">
                <thead>
                  <tr>
                    <th></th>
                    <th class="col-annual">Annually</th>
                    <th class="col-monthly">Monthly</th>
                    <th class="col-weekly">Weekly</th>
                    <th class="col-daily">Daily</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="fig in result.headlineFigures"
                    :key="fig.label"
                    :class="{ 'take-home-row': fig.label === 'Take Home' }"
                  >
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
                    <td class="col-annual">£{{ formatCurrency(fig.annual) }}</td>
                    <td class="col-monthly">£{{ formatCurrency(fig.month) }}</td>
                    <td class="col-weekly">£{{ formatCurrency(fig.week) }}</td>
                    <td class="col-daily">£{{ formatCurrency(fig.day) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="rates-row">
              <span class="effective-rate">Effective: {{ formatCurrency(result.effectiveRate) }}%</span>
              <span v-if="marginalRate" class="marginal-rate">
                Marginal: {{ marginalRate.total }}%
                <template v-if="marginalRate.itRate > 0">
                  = {{ marginalRate.itRate }}% IT<template v-if="marginalRate.isTaper">*</template> + {{ marginalRate.niRate }}% {{ marginalRate.nicLabel }}
                </template>
                <template v-else>
                  = {{ marginalRate.niRate }}% {{ marginalRate.nicLabel }} only
                </template>
              </span>
            </div>
            <div class="share-row">
              <button class="share-btn" @click="copyShareUrl">Share</button>
              <span v-if="shareMessage" class="share-message">{{ shareMessage }}</span>
            </div>

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
          </Transition>
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
    <div v-if="takeHomeAnnual !== null" class="sticky-footer">
      <span>Take Home</span>
      <span class="sticky-footer-amount">£{{ Math.round(takeHomeAnnual).toLocaleString("en-GB") }}/yr</span>
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

main.main {
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem;
  padding-bottom: 5rem;
  box-sizing: inherit;
  position: relative;
}

.app-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  align-items: start;

  @media screen and (max-width: 850px) {
    grid-template-columns: 1fr;
  }
}

.form-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.form-panel h1 {
  margin-top: 1.75rem;
}

.results-panel {
  padding-top: 1rem;
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

@media screen and (max-width: 650px) {
  .divider {
    height: 1px;
    width: 100%;
    background: $red-to-pink-to-purple-horizontal-gradient;
    margin-block: 1.5rem;
  }

  .form-element {
    width: 100%;
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
  border: 1px solid var(--border);
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
  padding: 10px 8px;
  border-bottom: 1px solid var(--table-cell-border);
  text-align: right;
}

table.calculator-table th:first-child,
table.calculator-table td:first-child {
  text-align: left;
}

table.calculator-table tbody tr:nth-child(even) {
  background: var(--table-stripe);
}

.take-home-row td {
  color: var(--accent);
  font-size: 1.05rem;
  font-weight: 800;
  border-top: 1px solid var(--take-home-separator);
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
  color: var(--text);
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
  border-bottom: 1px solid var(--table-header-border);
}

.employer-cost-box {
  border-color: var(--employer-border);
}

#employer-nic-category {
  min-width: 0;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
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

// Income breakdown bar
.income-bar-wrap {
  margin-bottom: 1rem;
}

.income-bar {
  display: flex;
  gap: 2px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
}

.income-bar-segment {
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.income-bar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-subtle);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.income-form-element {
  align-items: flex-start;
}

.income-input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

#income {
  min-width: 0;
  flex: 1;
  width: 0; // forces flex shrink; actual size determined by flex container
}

// Salary slider
.income-slider {
  appearance: none;
  -webkit-appearance: none;
  background: var(--slider-track) !important;
  padding: 0 !important;
  height: 6px;
  border-radius: 3px;
  accent-color: var(--accent);
  cursor: pointer;
  width: 100%;
  margin-top: 0.75rem;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
  }
}

// Band nudge
.band-nudge {
  width: 400px;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--accent);
  background: var(--nudge-bg);
  border-radius: 0 4px 4px 0;
  font-size: 0.8rem;
  color: var(--text-subtle);

  @media screen and (max-width: 650px) {
    width: 100%;
  }
}

// Taper warning
.taper-warning {
  width: 400px;
  padding: 0.6rem 0.75rem;
  border-left: 3px solid var(--taper-accent);
  background: rgba(245, 166, 35, 0.08);
  font-size: 0.8rem;
  color: var(--text-subtle);
  line-height: 1.4;

  strong {
    color: var(--taper-accent);
  }

  @media screen and (max-width: 650px) {
    width: 100%;
  }
}

// Rates row
.rates-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--take-home-separator);
  font-size: 0.9rem;
}

.effective-rate {
  color: var(--accent);
  font-weight: 700;
}

.marginal-rate {
  color: var(--text-muted);
}

// Pension tooltip
.tooltip-wrap {
  position: relative;
  display: inline-block;
  margin-inline: 0.2rem;
}

.info-icon {
  font-size: 0.8rem;
  color: #888;
  cursor: help;
}

.tooltip-text {
  display: none;
  position: absolute;
  left: 0;
  top: 1.4em;
  width: 240px;
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  padding: 0.75rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text-subtle);
  z-index: 10;
  border-radius: 4px;
  font-weight: 400;

  strong {
    color: var(--text);
  }
}

.tooltip-wrap:hover .tooltip-text {
  display: block;
}

// Share row
.share-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.share-btn {
  background: transparent;
  border: 1px solid var(--employer-border);
  color: var(--text-muted);
  padding: 0.3rem 1rem;
  font-size: 0.8rem;
  border-radius: 4px;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
}

.share-message {
  font-size: 0.8rem;
  color: var(--accent);
}

// Frequency tabs (mobile only)
.freq-tabs {
  display: none;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  @media screen and (max-width: 650px) {
    display: flex;
  }
}

.freq-tab {
  flex: 1;
  background: transparent;
  border: 1px solid var(--border-input);
  color: var(--text-muted);
  padding: 0.35rem 0;
  font-size: 0.75rem;
  border-radius: 4px;

  &.active {
    background: var(--accent);
    color: var(--accent-on);
    border-color: var(--accent);
    font-weight: 700;
  }
}

// Hide non-active columns on mobile inside the freq-* table-wrap
@media screen and (max-width: 650px) {
  .table-wrap.freq-annual .col-monthly,
  .table-wrap.freq-annual .col-weekly,
  .table-wrap.freq-annual .col-daily { display: none; }

  .table-wrap.freq-monthly .col-annual,
  .table-wrap.freq-monthly .col-weekly,
  .table-wrap.freq-monthly .col-daily { display: none; }

  .table-wrap.freq-weekly .col-annual,
  .table-wrap.freq-weekly .col-monthly,
  .table-wrap.freq-weekly .col-daily { display: none; }

  .table-wrap.freq-daily .col-annual,
  .table-wrap.freq-daily .col-monthly,
  .table-wrap.freq-daily .col-weekly { display: none; }
}

// Sticky take-home footer (mobile only)
.sticky-footer {
  display: none;

  @media screen and (max-width: 850px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--sticky-bg);
    border-top: 2px solid var(--accent);
    padding: 0.75rem 1.5rem;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    font-size: 0.95rem;
    color: var(--text-muted);
  }
}

.sticky-footer-amount {
  color: var(--accent);
  font-weight: 700;
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Theme toggle
.theme-toggle-row {
  width: 400px;
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;

  @media screen and (max-width: 650px) {
    width: 100%;
  }
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-input);
  color: var(--text-muted);
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  border-radius: 6px;
  line-height: 1;

  &:hover {
    border-color: var(--accent);
  }
}
</style>
