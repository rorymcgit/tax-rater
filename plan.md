# Growth Plan: Calculator Improvements & Ad Revenue & SEO

## Slice A — Input flexibility ✅
Small UX changes with outsized impact on usefulness.

- [x] Add income frequency toggle (annual / monthly / weekly) so users can enter their contract salary directly
- [x] Auto-calculate on input change (remove the Calculate button, or make it optional)
- [x] Add Scotland residency option — Scotland has 6 bands (starter 19%, basic 20%, intermediate 21%, higher 42%, advanced 45%, top 48%)

---

## Slice B — Pension contributions ✅
Pension is one of the most commonly asked-about deductions. Salary sacrifice also reduces NICs.

- [x] Add pension contribution input (% or £ amount)
- [x] Support two modes:
  - **Salary sacrifice** — reduces gross income before tax *and* NICs
  - **Personal/relief at source** — reduces taxable income only (not NICs)
- [x] Show pension contribution as a line in the headline figures table

---

## Slice C — Student loan repayments ✅
A very large proportion of UK workers have student loans. Each plan has different thresholds.

- [x] Add student loan plan selector (None / Plan 1 / Plan 2 / Plan 4 / Plan 5 / Postgraduate)
- [x] Implement repayment calculation per plan:
  - Plan 1: 9% above £24,990
  - Plan 2: 9% above £27,295
  - Plan 4 (Scotland): 9% above £31,395
  - Plan 5: 9% above £25,000
  - Postgraduate: 6% above £21,000
- [x] Show student loan repayment as a line in the headline figures table

---

## Slice D — Self-employed / sole trader mode
Noted as a TODO in `national-insurance.ts`. Opens up a whole new audience.

- [ ] Add employment type toggle (Employed / Self-employed)
- [ ] For self-employed: replace Class 1 NICs with Class 2 + Class 4
  - Class 2: £3.45/week flat rate if profits > £12,570
  - Class 4: 6% on £12,570–£50,270, 2% above £50,270
- [ ] Self-employed users pay income tax on profit, not salary — update labelling accordingly

---

## Slice E — Employer NICs
Useful for employers, HR, and contractors comparing inside/outside IR35.

- [ ] Add optional "show employer NICs" toggle
- [ ] Employer Class 1: 13.8% on earnings above £9,100 (secondary threshold)
- [ ] Show as a separate section below the main results, clearly labelled as employer cost not employee deduction

---

## Slice F — Dividend income (company directors)
Relevant for limited company directors who pay themselves via salary + dividends.

- [ ] Add a dividend income field (separate from salary)
- [ ] Implement dividend tax calculation:
  - Dividend allowance: £500 tax-free
  - Basic rate band: 8.75%
  - Higher rate band: 33.75%
  - Additional rate: 39.35%
- [ ] Dividends sit on top of salary for band purposes — combined calculation needed

---

## Slice 1 — Deploy to a real domain
Get the site live on a public URL before anything else matters.

- [ ] Choose hosting (Vercel / Netlify / Cloudflare Pages recommended)
- [ ] Register a domain (e.g. `uktaxcalculator.co.uk`)
- [ ] Set up HTTPS (automatic on all three hosts above)
- [ ] Configure CI/CD so `main` deploys automatically

---

## Slice 2 — SEO foundations (technical)
Low effort, high value. Can be done in a single sitting.

- [ ] Add `<title>` and `<meta name="description">` with target keywords
- [ ] Add Open Graph tags (`og:title`, `og:description`, `og:url`)
- [ ] Create `public/robots.txt`
- [ ] Create `public/sitemap.xml`
- [ ] Submit site to Google Search Console
- [ ] Verify Core Web Vitals are healthy (Lighthouse audit)

---

## Slice 3 — Legal & compliance
Required before running ads. Also builds user trust.

- [ ] Write a Privacy Policy page (what data is collected, cookie usage)
- [ ] Write a Terms of Service page
- [ ] Add a GDPR-compliant cookie consent banner
- [ ] Add a footer with links to both pages

---

## Slice 4 — Content: on-page SEO
Google needs text to index. A calculator alone won't rank.

- [ ] Add an intro paragraph explaining what the tool does and who it's for
- [ ] Add a "How it works" section explaining the tax bands
- [ ] Add an FAQ section with common questions, e.g.:
  - What is the personal allowance?
  - How is income tax calculated in the UK?
  - What are NICs?
  - What changed in the 2025/2026 tax year?
- [ ] Add structured data (JSON-LD `FAQPage` schema) to the FAQ

---

## Slice 5 — Analytics & Search Console
Understand where traffic comes from and what's working.

- [ ] Set up Google Analytics 4 (or privacy-friendly alternative: Plausible, Fathom)
- [ ] Connect Google Search Console to the domain
- [ ] Set up a Search Console property and verify ownership
- [ ] Monitor impressions, clicks, and average position weekly

---

## Slice 6 — Google AdSense
Can only apply once the site has real content, a privacy policy, and some traffic.

- [ ] Apply for a Google AdSense account
- [ ] Add the AdSense verification snippet while awaiting approval
- [ ] Once approved, place ads tastefully:
  - Below the results section
  - Sidebar (desktop only)
- [ ] Test ad load doesn't hurt Core Web Vitals

---

## Slice 7 — Differentiation & niche content
The UK tax calculator space is competitive. This is how you carve out space.

- [ ] Add a contractor / IR35 mode (inside vs outside IR35 comparison)
- [ ] Add a self-employed / sole trader calculator (Class 2 + Class 4 NICs)
- [ ] Add a dividend income calculator (for company directors)
- [ ] Write a blog post / guide for each niche (links in from Google)
- [ ] Share in relevant communities (r/UKPersonalFinance, MoneySavingExpert forums)

---

## Slice 8 — Backlinks & distribution
The biggest SEO lever after content.

- [ ] Post in r/UKPersonalFinance and r/personalfinance (UK flair)
- [ ] Submit to "free tools" directories and personal finance resource lists
- [ ] Reach out to personal finance bloggers for inclusion in their "useful tools" posts
- [ ] Write a guest post on a UK money blog linking back to the site
