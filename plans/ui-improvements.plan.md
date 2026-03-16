# UI Improvements Plan

## Context
The tax calculator (`src/App.vue`) has a solid dark-theme design (`background: #00001e`, accent `#d8f24e`) but is a single-column layout with a plain results table. The goal is to improve usability, information density, and visual polish across 5 categories, all implemented within `src/App.vue` (scoped SCSS) and `src/style.scss`.

Key codebase facts:
- Vue 3 Composition API, `<script setup lang="ts">`, scoped SCSS
- Global styles in `src/style.scss` style all `input, button, select` with the lime accent background
- `result` is a `computed<CalculationResult | null>` — all UI derives from it
- `headlineFigures` array order: Gross Income → [Pension] → Income Tax → NI → [Student Loan] → Take Home
- England bands: PA £12,570 / Basic £50,270 / Taper starts £100k / Additional £125,140
- Scotland bands: £12,570 / £15,397 / £27,491 / £43,662 / £75,000 / £100k taper / £125,140
- Employee NI: 0% to £12,584 / 8% to £50,284 / 2% above
- Self-employed Class 4 NI: 6% £12,570–£50,270 / 2% above

---

## Critical Files
- `src/App.vue` — all changes land here (template + scoped SCSS)
- `src/style.scss` — global input/button/select styles (read-only context; only touch if needed for slider override)

---

## Category 1: Visual / Layout

### Two-column grid on desktop
- Replace `.content-container > .content` with `.app-layout` using CSS Grid: `grid-template-columns: 400px 1fr` on desktop, `1fr` on mobile (breakpoint ≤850px)
- Left panel `.form-panel`: h1 + all form elements, `display: flex; flex-direction: column; align-items: center`
- Right panel `.results-panel`: income bar + results table + breakdowns
- `main.main`: change `align-items: center` → `align-items: flex-start`; add `padding-bottom: 5rem` for mobile sticky footer

### Income breakdown bar
- New `computed<IncomeBarSegment[]>` called `incomeBar` — iterates `result.headlineFigures`, skips "Gross Income", maps each label to a colour and `pct = value / annualGross * 100`
- Colour map: Pension `#5bc0eb` · Income Tax `#e8563a` · NI `#9b5de5` · Student Loan `#00bbf9` · Take Home `#d8f24e`
- Rendered as a flex row of `<div>` segments with `width: seg.pct%`, height 28px, `border-radius: 6px`, `overflow: hidden`, `transition: width 0.3s ease`
- Legend row below bar with coloured 10×10 dots

### Highlight Take Home row
- Add `:class="{ 'take-home-row': fig.label === 'Take Home' }"` to the `<tr>` in the main table
- CSS: `.take-home-row td { color: #d8f24e; font-size: 1.05rem; font-weight: 800; border-top: 1px solid #222; }`

### Rename "Amount:" label
- Change `<label for="pension-amount">Amount: </label>` → `Pension Contribution:`

### Row striping
- `table.calculator-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.02); }`
- Increase cell padding to `10px 8px` (up from 8px)
- Right-align numeric columns: `th, td { text-align: right } th:first-child, td:first-child { text-align: left }`

---

## Category 2: Usability

### Salary slider
- Add `<input type="range" min="0" max="300000" step="500" :value="sliderValue" @input="onSliderChange" class="income-slider">` below the income text input
- `const sliderValue = computed(() => getIncome())`
- `function onSliderChange(e): void { income.value = formatWithCommas(String(Number(e.target.value))) }`
- CSS: override global `input` styles — `.income-slider { appearance: none; background: #1a1a3e !important; padding: 0 !important; height: 6px; border-radius: 3px; accent-color: #d8f24e; cursor: pointer; width: 100%; margin-top: 0.75rem; }` with thumb pseudo-elements for webkit/moz

### Tax band threshold nudge
- New `const annualGross = computed(() => toAnnual(getIncome(), frequency.value))` — reused by nudge, taper, marginal rate, and income bar
- New `const nextBandMessage = computed<string | null>()` — switch on `annualGross.value` against England/Scotland thresholds, return e.g. `"£12,300 until Higher Rate (40%)"`
- Render as `<div v-if="nextBandMessage" class="band-nudge">` — styled with left accent border in `#d8f24e`, font-size 0.8rem

### Personal allowance taper warning
- `const showTaperWarning = computed(() => annualGross.value > 100_000 && annualGross.value < 125_140)`
- `<div v-if="showTaperWarning" class="taper-warning">` — amber (`#f5a623`) left border + subtle background, explains effective 60% marginal rate

### Marginal vs effective rate
- `const marginalRate = computed<{ total, itRate, niRate, nicLabel } | null>()`:
  - England IT: 0% / 20% / 40% / 60% (taper) / 45%
  - Scotland IT: 0% / 19% / 20% / 21% / 42% / 45% / 68% (taper) / 48%
  - Employed NI: 0% / 8% / 2% | Self-employed Class 4: 0% / 6% / 2%
- Render in `.rates-row` alongside existing effective rate: `"Marginal: 42% = 40% IT + 2% NI"`
- Note: taper zone shows `"60% effective"` with tooltip/asterisk to explain why

### Comparison mode
- Deferred — complex enough to warrant its own slice; skip for now

---

## Category 3: Information / Context

### Pension type tooltip
- Wrap pension label text in `.tooltip-wrap` containing `.info-icon` (ⓘ) + `.tooltip-text`
- Tooltip text: explains Salary Sacrifice (before tax+NI) vs Personal/Relief at Source (HMRC adds 20% basic rate relief)
- CSS: `.tooltip-wrap { position: relative }` + `.tooltip-text { display: none; position: absolute; width: 240px; background: #1a1a3e; border: 1px solid #333; padding: 0.75rem; font-size: 0.8rem; z-index: 10 }` + `.tooltip-wrap:hover .tooltip-text { display: block }`

### Employer NI display
- Deferred — lower priority

### Shareable URL
- `onMounted`: parse `window.location.search` URLSearchParams, restore: `income`, `region`, `freq`, `employment`, `pension`, `pensionMode`, `pensionInput`, `loan`
- `function getShareableUrl()`: build URLSearchParams from current state, return full URL
- `async function copyShareUrl()`: clipboard write + 2s "Copied!" feedback in `shareMessage` ref
- Render: `<button class="share-btn" @click="copyShareUrl">Share</button>` in `.share-row` below rates

---

## Category 4: Mobile / Responsiveness

### Single-column frequency tab toggle
- Add `const mobileFreqTab = ref<'annual'|'monthly'|'weekly'|'daily'>('annual')`
- Render `.freq-tabs` row of 4 buttons above table — `display: none` on desktop, `display: flex` on mobile (≤650px)
- Add class `col-annual/monthly/weekly/daily` to each `<th>` and `<td>`
- CSS: `.freq-annual .col-monthly, .freq-annual .col-weekly, .freq-annual .col-daily { display: none }` etc. scoped to `.table-wrap.freq-*`
- Active tab button styled with `background: #d8f24e; color: #00001e`

### Sticky take-home footer
- `const takeHomeAnnual = computed(() => result.value?.headlineFigures.find(f => f.label === 'Take Home')?.annual ?? null)`
- `<div v-if="takeHomeAnnual !== null" class="sticky-footer">` at end of `<main>`
- CSS: `display: none` on desktop, on mobile (≤850px): `display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: #0a0a2e; border-top: 2px solid #d8f24e; padding: 0.75rem 1.5rem; justify-content: space-between; z-index: 100`
- Shows "Take Home" label + `£XX,XXX/yr` in accent colour

---

## Category 5: Polish

### Animated transitions
- `<Transition name="fade">` wrapping the result panel content (`v-if="result"`)
- `.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease }` + from/to `opacity: 0`
- Income bar segments already get `transition: width 0.3s ease` for smooth updates

### Light/dark mode toggle
- Deferred — requires CSS custom properties refactor across `style.scss` and scoped styles

### Softer accent colour
- Deferred — low priority, subjective

---

## Execution Order (single branch, one PR)
1. Layout restructure (two-column grid) — foundation for everything else
2. Take Home highlight + row striping + label rename — quick wins
3. Income bar — new computed + template block
4. Salary slider — new input + handler
5. Band nudge + taper warning + marginal rate — new computeds
6. Pension tooltip — CSS only
7. Shareable URL — onMounted + share button
8. Mobile: freq tabs + sticky footer
9. Fade transition — wrap in `<Transition>`

All changes stay in `src/App.vue` (script + template + scoped SCSS). No new files needed.

---

## Verification
- `npm test` — no regressions in calculator logic (calculators untouched)
- `npm run dev` — manual check:
  - Desktop (≥900px): two-column layout, income bar, slider, nudge, share button
  - Mobile (≤650px): single-column, freq tabs, sticky footer visible
  - Enter £50,000 England: Basic rate nudge shows `£270 until Higher Rate (40%)`
  - Enter £110,000 England: taper warning shown, marginal rate shows `62% = 60% IT + 2% NI`
  - Share button: copies URL, reloading URL restores all inputs
