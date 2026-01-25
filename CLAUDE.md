# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `npm run dev` (runs on localhost:5173)
- **Build**: `npm run build`
- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run single test file**: `npx vitest run src/calculators/income-tax.spec.ts`

## Architecture

Vue 3 application with Composition API and Vite for calculating UK income tax and national insurance contributions for the 2025/2026 tax year.

### Key Files

- `src/App.vue` - Main component with form handling and result display
- `src/calculators/income-tax.ts` - UK income tax calculation with band breakdowns (personal allowance, basic, higher, additional rates) and personal allowance tapering above £100k
- `src/calculators/national-insurance.ts` - Employee NICs (Class 1, Category A) calculation
- `src/types/tax.ts` - Shared types for tax band breakdowns

### Patterns

- Vue 3 Composition API with `<script setup>`
- Calculator modules export plain functions (no classes)
- Calculator functions return breakdown arrays with per-band taxable amounts and tax due
- Currency input auto-formats with thousands separators; strips commas before calculation

## Tax Year Rates (2025/2026)

**Income Tax Bands:**
- Personal Allowance: £0-£12,570 (0%)
- Basic: £12,570-£50,270 (20%)
- Higher: £50,270-£125,140 (40%)
- Additional: £125,140+ (45%)

**Employee NICs (Class 1):**
- £0-£12,584 (0%)
- £12,584-£50,284 (8%)
- £50,284+ (2%)
