# UI Improvements 2 — Visual Polish

## Context
The current UI has a jarring mismatch: the dark navy theme (`#00001e`) is undermined by
`style.scss` painting every `input`, `select`, and `button` with the bright lime accent
(`#d8f24e`). This makes all form controls look like highlighter stickers slapped onto a
professional dark UI. A secondary bug makes the salary slider appear as a tiny floating
dot rather than a full-width track. Several smaller issues compound the roughness.

---

## Critical Files
- `src/style.scss` — global input/select/button overrides (root cause of lime inputs)
- `src/App.vue` — scoped SCSS + template (slider layout bug, result box border, etc.)

---

## Fix 1 — Dark-themed form controls (biggest impact)

**`src/style.scss`** — replace the current blanket lime rule:

```scss
// OLD
input, button, select {
  background: #d8f24e; color: #00001e; ...
}

// NEW
input:not([type="range"]):not([type="radio"]):not([type="checkbox"]),
select {
  background: #0d0d30;
  color: #e2e0e0;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  padding: 8px;
  font-weight: 600;
  font-family: inherit;
}

input:not([type="range"]):not([type="radio"]):not([type="checkbox"]):focus,
select:focus {
  outline: none;
  border-color: #d8f24e;
  box-shadow: 0 0 0 2px rgba(216, 242, 78, 0.12);
}

input::placeholder { color: #4a4a6e; font-weight: 400; }

button {
  background: #d8f24e;
  color: #00001e;
  font-weight: 800;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-family: inherit;
}
```

Buttons stay lime (they are few: freq tabs, share, etc.) but each has scoped overrides
already in place (`.share-btn`, `.freq-tab`) so they won't be affected.

**`src/App.vue` scoped** — remove all `!important` overrides on `.share-btn` and
`.freq-tab` that were compensating for the global lime background; plain rules now
suffice since the global default is no longer lime.

Add `accent-color: #d8f24e` to `input[type="checkbox"]` and `input[type="radio"]` so
they use the lime accent rather than the OS default.

---

## Fix 2 — Salary slider layout bug

The `<input type="range">` is currently a flex sibling of `.input-row` inside
`.form-element` (`display: flex; align-items: center`), so it collapses to a tiny
inline dot.

**Template fix** — wrap the income input + slider together in a new `.income-input-group`
div that replaces the raw `.input-row`:

```html
<div class="form-element income-form-element">
  <label for="income">Income: </label>
  <div class="income-input-group">
    <div class="input-row">
      <span>£</span>
      <input id="income" ... />
      <select v-model="frequency" ...></select>
    </div>
    <input type="range" class="income-slider" ... />
  </div>
</div>
```

**Scoped CSS** — `.income-form-element` gets `align-items: flex-start`;
`.income-input-group` gets `display: flex; flex-direction: column; width: 100%` (or
the right-hand column width).

---

## Fix 3 — Result box border

Change `.result-box` border from `1px solid #eee` → `1px solid #1a1a3e` so it blends
with the dark background rather than glowing white.

---

## Fix 4 — Minor polish

- **Band nudge / taper warning**: remove hardcoded `width: 400px`, use `width: 100%`
  inside `.form-panel` so they stretch correctly on all screen sizes.
- **Income bar segments**: add `gap: 2px` on `.income-bar` so adjacent colours are
  visually distinct (currently they bleed into each other when proportions are similar).
- **Legend dots**: change `border-radius: 2px` → `border-radius: 50%` to make them
  proper circles.
- **Form panel gap**: add `gap: 0.6rem` to `.form-panel` (or consistent `margin-top`
  on `.form-element`) for uniform vertical rhythm.

---

## Execution Order
1. `style.scss` — dark input/select theme + checkbox/radio accent-color
2. `App.vue` scoped — remove `!important` overrides on share-btn/freq-tab
3. `App.vue` template — restructure income input + slider into `.income-input-group`
4. `App.vue` scoped — `.income-form-element` + `.income-input-group` layout styles
5. `App.vue` scoped — result box border, nudge/warning width, bar gap, dot shape, form-panel gap

---

## Verification
- `npm test` — no regressions
- `npm run dev` — manual check:
  - All text inputs, selects are dark-themed; lime shows only on focus ring + thumb + active tabs
  - Radio buttons and checkbox render with lime accent colour
  - Income slider renders as a full-width track below the income row, not a dot
  - Result box has a subtle dark border
  - Band nudge and taper warning span the full form width
  - Income bar segments have visible gaps between colour blocks
  - Legend dots are circular
