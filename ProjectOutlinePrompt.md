> **Goal:** Generate a complete, minimal, production-ready **React PWA** project (desktop + mobile responsive) that improves the public experience of checking **SAPS firearm application status**.
>
> **Context:** This endpoint is used to check where a firearm application / renewal is in the process. Today, the public relies on the SAPS website UI to make the call — but the site is often **slow**, **inconsistent/unreliable**, and **not phone-friendly**. This project creates a simple, mobile-first frontend that only asks for a **Reference Number** (and optional **Serial Number**), makes the request via a tiny proxy, and extracts the results.
>
> **Hosting:** The frontend must be a **public GitHub repo** hosted on **GitHub Pages**.
>
> **Architecture:** The backend must be **proxy-only** (no business logic or parsing). All parsing/logic happens in the frontend.
>
> **Caching:** The frontend must cache responses for **5 minutes**.

---

## COPILOT PROMPT

You are an expert full-stack engineer. Create a new repository from scratch with the following requirements.

### 1) Tech stack (keep it lightweight)

* Frontend: **React + Vite + TypeScript**.
* Styling: prefer **vanilla CSS (CSS modules)** or minimal utility CSS; avoid heavy UI frameworks.
* PWA: use `vite-plugin-pwa` for manifest + service worker.
* Lint/format: ESLint + Prettier.

### 2) UX / UI requirements

Build a single-page app that is responsive and scales well from mobile to desktop.

Visual design requirements:

* Must look **professional, modern, and trustworthy**.
* Use a clean layout, consistent spacing/typography, subtle shadows, and accessible contrast.
* Follow current best practices for UI and software design.

Security and engineering standards:

* Follow current best practices for secure coding and web app security.
* Validate inputs, handle errors safely, avoid leaking sensitive values in logs, and keep dependencies minimal and up to date.

The frontend must display the following text content (verbatim) near the top of the page:

* `For any enquiries regarding the status of your Firearm application or Renewal of Firearm License, provide Reference Number OR Serial Number AND Reference Number`
* `For any enquiries regarding the status of your Competency application, provide ONLY the Reference Number`

Add a clear disclaimer block (visible on the page, near the top, not hidden in footer):

* State that the app **queries SAPS servers** and only displays the status returned from SAPS.
* State that the app is designed to be **POPIA-compliant** (no unnecessary collection, purpose limitation, minimal retention).
* State that the app **does not store personal data** beyond short-lived **on-device caching** (5 minutes) used only to reduce repeated queries.
* State that **no server-side logging** of reference/serial numbers is performed by the app’s proxy (and that the proxy is configured to avoid request logging).
* State that this project is **not affiliated with SAPS**.

Form fields:

* **Reference Number** (required)
* **Serial Number** (optional)

Buttons:

* Submit
* Clear

Below the form, always show:

* `Take note: The data on this page were updated on 2026-02-02. The results shown include finalized as well as outstanding applications for the year prior to the updated date.`

Below that show a section title:

* `Search Results:`

Default state (before search): show the message:

* `Please supply a Serial Number AND Reference Number OR Reference Number ONLY to search on...`

Results rendering:

* Display a table with these columns **exactly** (in this order):

  1. Application Type
  2. Application Number
  3. Calibre
  4. Make
  5. Serial Number
  6. Status Date
  7. Status
  8. Status Description
  9. Next Step

Error and empty states:

* If parsing yields “no results”, show a friendly message.
* If proxy fails/timeouts, show an error banner and allow retry.

Accessibility:

* Proper labels, focus states, keyboard navigation.
* Mobile-friendly input types.

### 3) Data source and backend/proxy (required) and backend/proxy (required)

**Do not call the SAPS site directly from the browser** (CORS/CSRF/cookies make it unreliable). Instead, create a **proxy-only** backend that returns the **raw HTML** response to the frontend. **All parsing/logic must be done in the frontend.**

Backend/proxy requirements:

* Provide a single endpoint:

  * `POST /api/proxy/firearm-status`
* Accept JSON body:

  * `fsref` (reference number, required)
  * `fserial` (serial number, optional)
* Validate inputs:

  * `fsref` required
  * `fserial` optional
  * max length 40 each
* Proxy performs the upstream request exactly like the website:

  * Upstream endpoint: `https://www.saps.gov.za/services/firearm_status_enquiry.php`
  * Method: POST
  * Content-Type: `application/x-www-form-urlencoded`
  * Body: `csrf_token=&fsref=<fsref>&fserial=<fserial>`
* Proxy returns JSON:

  * `{ "html": "<full html...>", "fetchedAt": "<ISO timestamp>", "query": {"fsref": "...", "fserial": "..."} }`
  * No parsing, no transformation into business fields on the backend.
* Add:

  * Reasonable upstream timeout.
  * Basic per-IP rate limiting.

Frontend parsing requirement (regex-first, as requested):

* The frontend must extract the results from the returned HTML using **regex** to locate:

  * the results table: `<table class='table table-bordered table-hover table-striped'>...` containing the header row and any data rows.
* Then parse that table into structured data objects and render.
* Be defensive: if the HTML changes, fail gracefully with a useful error, and include a “Report issue” link to GitHub.

### 4) Hosting (must be free tier) + architecture

Pick a free, scalable setup:

* **Frontend:** GitHub Pages (free)
* **Backend/proxy:** Cloudflare Workers (free)

Implement the backend as a Cloudflare Worker in the same repo (monorepo) using Wrangler.

Important GitHub Pages details:

* Configure Vite `base` for GitHub Pages (repo-name subpath). Either:

  * set `base: '/<repo-name>/'` in `vite.config.ts`, or
  * compute from an env var for flexibility.
* Add SPA fallback for Pages (e.g., copy `index.html` to `404.html` in build) so refresh/deep links work.

Repo layout suggestion:

* `/apps/web` (Vite React app)
* `/apps/worker` (Cloudflare Worker)
* root-level shared configs (eslint/prettier)

### 5) Frontend caching requirement (strict)

The frontend must cache **search responses** keyed by `{fsref, fserial}`.

Rules:

* If the same query is repeated within **5 minutes**, return the cached parsed result immediately and do **not** call the proxy.
* After 5 minutes, the next search should call the proxy again and refresh the cache.

Implementation:

* Use `localStorage` or `indexedDB` (localStorage is acceptable if you keep it simple).
* Cache value must include a timestamp.
* Implement `Clear` button that clears the form **and** clears the cached entry for the current query.
* Also add an optional “Clear all cached results” action in a small settings area.

### 6) Environment configuration

* The web app must read the proxy base URL from an env var:

  * `VITE_API_BASE_URL`
* Provide `.env.example`.

### 7) README.md (required, complete)

Generate a thorough README that includes:

* What the project does (disclaimer: not affiliated with SAPS).
* Why it exists (slow/inconsistent website, not mobile friendly).
* Privacy & data handling:

  * Queries are made against SAPS servers via a proxy.
  * No personal data is stored server-side.
  * Only short-lived **client-side cache (5 minutes)** exists to reduce repeated calls.
  * Proxy must be configured to avoid logging request bodies and to minimize any telemetry.
* Local dev instructions:

  * Install deps
  * Run web
  * Run worker
  * How to point web to worker locally
* How the 5-minute caching works.
* How parsing works (regex extraction + table parsing) and what fields are extracted.
* Deployment instructions for GitHub Pages + Cloudflare Worker.
* **How to install / add to home screen** (PWA install) with steps for:

  * Android (Chrome)
  * iOS (Safari: Share → Add to Home Screen)
  * Desktop Chrome/Edge (Install icon)
* Troubleshooting section (CORS, upstream changes, parsing failures).

### 8) CI/CD pipelines (required)

Add GitHub Actions workflows:

1. `ci.yml`

* Runs on PRs and pushes
* Installs dependencies
* Lints + typechecks
* Builds web
* Runs worker build/typecheck

2. `deploy.yml`

* Deploys on push to `main`
* Deploy **web to GitHub Pages** using the official GitHub Pages Actions flow (`actions/configure-pages`, build, `actions/upload-pages-artifact`, `actions/deploy-pages`).
* Deploy **worker to Cloudflare Workers** using Wrangler.

Notes:

* Use GitHub Secrets for Cloudflare tokens/account IDs.
* Document required secrets in README.

### 9) Implementation details (must include)

Frontend:

* A simple page layout: title, context blurb, instructions, form, status area, results table.
* Loading state.
* Results table should be horizontally scrollable on small screens.
* Use a fetch wrapper that enforces caching rules.
* Regex/table parsing must produce objects with these keys:

  * `applicationType`, `applicationNumber`, `calibre`, `make`, `serialNumber`, `statusDate`, `status`, `statusDescription`, `nextStep`

Backend/Worker:

* Endpoint: `POST /api/proxy/firearm-status`
* Validate inputs and rate limit.
* Upstream fetch to SAPS endpoint.
* Return JSON with raw HTML.

### 10) Output

Create all necessary files with correct code. Keep dependencies minimal. Make sure the project runs.

---

## After generating the project, include a short checklist in the README for me (the repo owner) to do next

GitHub Pages:

* Create a new **public** GitHub repo
* Enable GitHub Pages (Settings → Pages) and set Source to **GitHub Actions**
* Ensure the repo name matches the Vite `base` path configuration

Cloudflare Worker:

* Create a Cloudflare account (if needed)
* Create a Worker using Wrangler (`wrangler login`)
* Set GitHub Secrets required for deploy:

  * `CLOUDFLARE_API_TOKEN`
  * `CLOUDFLARE_ACCOUNT_ID`
* Deploy worker and note the public Worker URL

Frontend config:

* Set `VITE_API_BASE_URL` to the deployed Worker base URL
* Confirm the app works on mobile and desktop

That’s it. Generate the full project now.