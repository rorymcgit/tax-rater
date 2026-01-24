# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `npm start` (runs on localhost:4200)
- **Build**: `npm run build`
- **Run all tests**: `npm test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run single test file**: `npx jest src/app/income-tax-calculator.spec.ts`

## Architecture

Angular 18 standalone component application for calculating UK income tax and national insurance contributions for the 2025/2026 tax year.

### Key Files

- `src/app/app.component.ts` - Main component with form handling and result display
- `src/app/income-tax-calculator.service.ts` - UK income tax calculation with band breakdowns (personal allowance, basic, higher, additional rates) and personal allowance tapering above £100k
- `src/app/national-insurance-calculator.service.ts` - Employee NICs (Class 1, Category A) calculation
- `src/app/tax-breakdown.interface.ts` - Shared types for tax band breakdowns

### Patterns

- All components are standalone (no NgModules)
- Reactive Forms for input handling
- Calculator services return breakdown arrays with per-band taxable amounts and tax due
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
