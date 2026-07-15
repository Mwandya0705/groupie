# IUU Surveillance & Patrol Monitoring — Project Guide

A complete, descriptive walkthrough of **every screen in the mobile app** and **every section of the web dashboard** — what each does, how to use it, and the knowledge/technology used to build it.

> **What the system does:** It helps fisheries-enforcement officers run *patrols*, report *IUU* (Illegal, Unreported, Unregulated) fishing *incidents* from the field — even with no signal — and lets a command center monitor everything from a web dashboard. AI (OpenAI **gpt‑4.1‑mini**) analyses evidence photos and writes a ~300‑word incident report for each case.

---

## 1. System Architecture (the big picture)

```
   MOBILE (Expo / React Native)            WEB (Next.js dashboard)
   ┌───────────────────────────┐           ┌───────────────────────────┐
   │ Officer in the field      │           │ Admin / command center     │
   │ • Patrols + GPS tracking  │           │ • Overview & analytics     │
   │ • Incident reports + AI   │           │ • Incidents, vessels, maps │
   │ • Offline vault + sync    │           │ • Reports, users, audit    │
   └─────────────┬─────────────┘           └─────────────┬─────────────┘
                 │                                        │
                 └──────────────►  SUPABASE  ◄────────────┘
                       Postgres + Auth + Storage + Row Level Security
                 (shared tables: profiles, patrols, incidents, evidence,
                  vessels, alerts, sync_logs, audit_logs, roles)
```

- **One shared Supabase backend** is the single source of truth. The mobile app writes patrols/incidents; the web reads and manages them. They are kept in sync by sharing the *exact same tables and column shapes*.
- **Offline-first** on mobile: anything captured without a connection is stored in a local **Vault** and uploaded automatically when the link returns.
- **AI** runs on the device at report time and the result is stored *inside* the incident, so it shows up on the dashboard automatically.

### Technology used (and why)
| Area | Tech | Why |
|---|---|---|
| Mobile | **Expo (SDK 56) + React Native + TypeScript** | One codebase for iOS/Android, fast iteration, type safety |
| Web | **Next.js 15 (App Router) + TypeScript** | Server components for fast, secure data fetching |
| Styling | **Custom design system** (Framer dark canvas) + Tailwind (web) | Consistent, poster-grade look across both apps; light/dark mode |
| Backend | **Supabase** (Postgres, Auth, Storage, RLS) | Managed Postgres + auth + file storage with row-level security |
| AI | **OpenAI gpt‑4.1‑mini** (chat + vision) | Threat analysis of evidence photos + auto-written reports |
| Maps/Charts (web) | **Leaflet / react-leaflet**, **Recharts** | Incident maps/heatmaps and analytics charts |
| State/Storage (mobile) | **AsyncStorage**, **NetInfo** | Local persistence, session caching, connectivity detection |

---

## 2. MOBILE APP — screen by screen

The app uses a **custom bottom-tab navigator** (no heavy navigation library) defined in `src/navigation/RootNavigator.tsx`. Tabs: **Mission · Reports · Vessels · Vault · Profile**. Authentication and the security lock sit *outside* the tabs.

### 2.0 Theme & design system (foundation)
- **Files:** `src/theme/index.ts` (tokens), `src/theme/ThemeContext.tsx` (light/dark provider), `src/components/index.tsx` (reusable UI).
- **What it is:** A token-based design system adapted from `DESIGN.md` — a near-black "canvas", charcoal surfaces, white text, one accent blue, and gradient "spotlight" cards. Reusable components: `Screen`, `Card`, `Button` (pill), `Field` (input with show/hide password), `SegTabs`, `Chip`, `StatusBadge`, `SpotlightCard`, `Txt`, `Eyebrow`.
- **Light/Dark:** `useTheme()` returns the active palette; components rebuild their styles via `makeStyles(colors)` + `useMemo`, so switching theme re-colors the whole app instantly. Default follows the device; user can override in Profile.
- **Knowledge used:** React Context for global theme state, design tokens, `StyleSheet` factory pattern, OpenType-style tight letter-spacing for the "poster" headline feel.

### 2.1 Login (`LoginScreen.tsx`)
- **Use it to:** sign in with **username or email** + password.
- **How it works:** if you type a non-email, it looks up your email from the `profiles` table by username, then authenticates. Includes a gradient "spotlight" header.
- **Knowledge/tech:** Supabase Auth (`signInWithPassword`), controlled form inputs, async/await error handling, the design-system `Field`/`Button`.

### 2.2 Signup (`SignupScreen.tsx`)
- **Use it to:** register a new officer (full name, username, email, password, confirm password) or **Continue as guest**.
- **How it works:** checks username uniqueness, validates that passwords match, then creates the account. A database trigger auto-creates the matching `profiles` row.
- **Knowledge/tech:** Supabase Auth `signUp` with user metadata, client-side validation, Postgres trigger (`handle_new_user`).

### 2.3 Security Lock (`SecurityScreen.tsx`)
- **Use it to:** unlock the app with **biometrics (Face/Touch ID)** or a **PIN** after a cold start or when the connection drops.
- **How it works:** on first use it sets a PIN (stored in AsyncStorage); afterwards it verifies it. Biometrics are attempted automatically when supported. A custom glass-style numpad is provided.
- **Knowledge/tech:** `expo-local-authentication`, AsyncStorage, `LinearGradient`, conditional rendering of locked state.

### 2.4 Mission (`MissionScreen.tsx` + `PatrolScreen.tsx` radar + embedded `IncidentScreen.tsx`)
This is the **main operational screen**. It has three parts:
1. **Patrol control** — choose **Land** or **Water** patrol and **Start mission**. Online, a real patrol row is created in Supabase (with a 12s timeout); offline it starts a local patrol that syncs later.
2. **Live radar** (`PatrolRadar`) — once tracking starts it logs your GPS position every 5 seconds, animating a pulsing radar and showing **GPS points** captured and **lock status**.
3. **Report incident** (embedded — see 2.5).
- **A "SIM" toggle** lets you simulate going offline to test the vault/sync flow.
- **Knowledge/tech:** `expo-location` (high-accuracy GPS), `setInterval` polling, animated radar (`Animated`), connectivity-aware logic, optimistic local IDs that get remapped to real UUIDs on sync.

### 2.5 Report Incident (`IncidentScreen.tsx`)
- **Use it to:** report a violation. Pick a **violation type**, add an **evidence photo**, write a **description**, and **Publish report**.
- **Evidence sources:** **Camera**, **Photo library**, or **Browse files / folders** (pick an image from anywhere on the device via the system file picker).
- **What happens on publish (online):**
  1. Captures your **real GPS** coordinates.
  2. **AI analysis** (gpt‑4.1‑mini, vision) → threat level, confidence, detected objects, summary.
  3. **AI report generation** → a formal ~300‑word incident report.
  4. The incident (with AI analysis + report) is posted to Supabase; the photo is uploaded to Storage **separately** so a photo glitch never loses the report.
- **Offline / local patrol:** the report is saved to the **Vault** (with its image) and syncs automatically later — and the message tells you the real reason rather than a misleading "connection failed".
- **Knowledge/tech:** OpenAI Chat Completions + vision (`src/services/aiService.ts`), base64 image handling, Supabase insert + Storage upload (raw bytes for reliability), robust error classification (network vs. database error).

### 2.6 Reports (`ReportsScreen.tsx`)
- **Use it to:** browse recently reported incidents (newest first), pull-to-refresh, and **Share / download** the AI-generated report for any incident.
- **Shows:** type, timestamp, threat badge, location, AI confidence, evidence thumbnail, and a pending-vault banner.
- **Knowledge/tech:** Supabase select with a joined `evidence(image_url)`, `RefreshControl`, native **Share** sheet (save/send the report as text), `expo-sharing`/`expo-file-system` for file export.

### 2.7 Vessels (`VesselsScreen.tsx`)
- **Use it to:** look up a vessel by **name or registration number** and instantly see whether it is **authorized**, **blacklisted**, or **investigating**.
- **How it works:** debounced live search against the `vessels` table.
- **Knowledge/tech:** Supabase `or(...ilike...)` queries, debounced input, status badges.

### 2.8 Vault (`PendingDataScreen.tsx`)
- **Use it to:** see everything captured offline that is **waiting to sync**, sync **one item** or **Sync all**, or discard items.
- **How it works:** the queue lives in AsyncStorage; patrols sync before incidents so that incident→patrol links resolve, and local IDs are remapped to real database UUIDs. Each flush writes a `sync_logs` row the dashboard can show.
- **Knowledge/tech:** offline-first queue (`src/store/offlineStore.ts`), dependency-ordered sync, AsyncStorage.

### 2.9 Profile (`ProfileScreen.tsx`)
- **Use it to:** view your name/role/email, see online status and pending count, switch **Dark/Light** appearance, **reset the security PIN**, and **sign out**.
- **Knowledge/tech:** theme context toggle, Supabase profile read, AsyncStorage PIN reset.

### 2.10 Connectivity engine (`src/hooks/useConnectivity.ts`)
- **What it is:** the "am I really online?" brain. It points NetInfo's reachability probe at the **Supabase health endpoint** and adds a 10s heartbeat + foreground re-check, so "ghost Wi‑Fi" (connected but no data) is correctly treated as offline, and a working connection is never falsely shown as offline.
- **Knowledge/tech:** `@react-native-community/netinfo` custom configuration, `AppState`, de-duplicated async probes.

### Mobile services layer (`src/services/`)
- `supabase.ts` — configured Supabase client (AsyncStorage session, auto-refresh).
- `authService.ts` — sign in/up/out + offline identity cache.
- `patrolService.ts` — create/update/end patrols; high-accuracy GPS.
- `incidentService.ts` — pickers (camera/library/files), reliable evidence upload, incident insert, fetch recent.
- `aiService.ts` — OpenAI gpt‑4.1‑mini analysis + 300-word report.
- `vesselService.ts` — vessel search.
- `syncService.ts` — writes `sync_logs` on each vault flush.

---

## 3. WEB DASHBOARD — section by section

Built with **Next.js App Router**. Most pages are **server components** that fetch data through `lib/queries.ts` using `@supabase/ssr`, so data loads on the server (fast + secure). A persistent **Sidebar** (`components/Sidebar.tsx`) navigates between sections, and a **ThemeToggle** switches light/dark (CSS-variable tokens on `<html>`). Access is **admin-only**, enforced by `middleware.ts` + a role check on login.

### 3.1 Login & Signup (`app/login`, `app/signup`)
- **Use it to:** sign in as a **System Administrator** (only admins may enter the dashboard).
- **Knowledge/tech:** Supabase SSR auth, role gate, the shared dark/light design tokens.

### 3.2 Overview (`app/dashboard/page.tsx` + `DashboardOverview.tsx`, `StatCard.tsx`)
- **Shows:** headline stats (total patrols, incidents, vessels, users), most-common violation, recent incidents, and a map/heatmap snapshot.
- **Knowledge/tech:** `fetchDashboardStats()` aggregates counts and groups incidents by month/type/hotspot in memory; `StatCard` summary tiles.

### 3.3 Live Patrols (`app/dashboard/patrols` + `[id]`, `PatrolTrackingMap.tsx`, `PatrolTrackingView.tsx`)
- **Use it to:** browse patrols (paginated, filter by land/water) and open a patrol to **replay its GPS route on a map**.
- **Knowledge/tech:** Leaflet polylines from the stored `route` JSON, server-side pagination/sorting.

### 3.4 Incident Management (`app/dashboard/incidents` + `IncidentsTable.tsx`, `ReportButton.tsx`)
- **Use it to:** review every reported violation in a table — date, type, description, **location**, **evidence** thumbnails, and the **AI report**.
- **Report column:** **View** opens the full ~300-word report in a modal; **.txt** downloads it. The report is read straight from the incident's `ai_analysis.report`, so it is always linked to the correct incident.
- **Knowledge/tech:** server fetch + client `ReportButton` (Blob download), filtering by type/date.

### 3.5 Hotspot Analytics (`app/dashboard/hotspots`, `IncidentHeatmap.tsx`)
- **Use it to:** see where incidents cluster geographically (heat layer + ranked coordinate buckets).
- **Knowledge/tech:** `leaflet.heat`, coordinate bucketing.

### 3.6 Vessel Monitoring (`app/dashboard/vessels`)
- **Use it to:** manage the vessel registry — authorized / blacklisted / investigating, owner info, last sighting.
- **Knowledge/tech:** Supabase reads from `vessels`.

### 3.7 AI Recognition (`app/dashboard/ai`)
- **Use it to:** review AI output per incident — confidence metrics, threat levels, detection queue, and evidence previews.
- **Knowledge/tech:** reads `ai_analysis` (the same JSON the mobile app wrote), aggregates confidence stats.

### 3.8 Reports (`app/dashboard/reports`, `IncidentCharts.tsx`)
- **Use it to:** view analytics charts (incidents per month, violations by type).
- **Knowledge/tech:** **Recharts** bar/line charts over aggregated query data.

### 3.9 User Management (`app/dashboard/users`)
- **Use it to:** view registered officers/admins and their roles.
- **Knowledge/tech:** reads `profiles`.

### 3.10 Roles & Permissions (`app/dashboard/roles`)
- **Use it to:** view the RBAC roles and their permission sets.
- **Knowledge/tech:** reads `roles` (JSON permission arrays).

### 3.11 Sync Monitor (`app/dashboard/sync`)
- **Use it to:** audit device sync activity — when each device last synced, success/failure, records moved.
- **Knowledge/tech:** reads `sync_logs` written by the mobile app on every vault flush.

### 3.12 Notifications (`app/dashboard/notifications`)
- **Use it to:** review system alerts, including **auto-raised alerts** for high/critical-threat incidents (a database trigger inserts these).
- **Knowledge/tech:** reads `alerts`; Postgres trigger `handle_high_threat_incident`.

### 3.13 Audit Logs (`app/dashboard/audit`)
- **Use it to:** see an immutable trail of actions for accountability.
- **Knowledge/tech:** reads `audit_logs` joined to `profiles`.

### 3.14 Settings (`app/dashboard/settings`)
- **Use it to:** adjust dashboard preferences.

### Web data layer (`lib/`)
- `queries.ts` — all server-side reads/aggregations (stats, patrols, vessels, AI, profiles, audit, sync, roles).
- `supabase/{client,server,middleware}.ts` — SSR-aware Supabase clients.
- `middleware.ts` — protects dashboard routes (auth/session).

---

## 4. Data model (shared tables)

| Table | Purpose | Written by |
|---|---|---|
| `profiles` | One row per user (name, username, role) | signup trigger |
| `patrols` | A mission with a GPS `route` (JSON) | mobile |
| `incidents` | A reported violation + `ai_analysis` (JSON incl. `report`) | mobile |
| `evidence` | Photo URLs for an incident | mobile → Storage |
| `vessels` | Authorization registry | seed/admin |
| `alerts` | Auto-raised high-threat alerts | trigger |
| `sync_logs` | Device sync history | mobile |
| `audit_logs` | Action trail | app |
| `roles` | RBAC definitions | seed |

**The sync contract:** the web reads `incidents.ai_analysis` using keys `threat_level`, `confidence_score`, `detected_objects`, `ai_summary`, `report`. The mobile app writes **exactly** that shape — that's what links the AI analysis and report to the right incident on the dashboard.

Apply the schema by pasting **`master_schema.sql`** (or the ordered files in **`schema_steps/`**) into the Supabase SQL Editor. It is idempotent and sets up tables, RLS, the public `evidence` storage bucket, the new-user trigger, and the auto-alert trigger.

---

## 5. Engineering concepts demonstrated
- **Offline-first architecture** with a local queue, dependency-ordered sync, and ID remapping.
- **Connectivity truthing** (real reachability vs. ghost Wi‑Fi).
- **Row Level Security** so only authenticated officers can write and only admins use the dashboard.
- **AI integration** (vision analysis + structured JSON output + long-form generation) with graceful degradation when offline or the API fails.
- **Design systems & theming** (tokens, light/dark, reactive styling).
- **Server components & SSR data fetching** on the web.
- **Separation of concerns** (screens ↔ services ↔ store ↔ hooks).

---

## 6. System Analysis & Core Design Decisions

This section addresses specific architectural constraints, choices, and supervisor evaluation feedback.

### 6.1 Legacy Workflow vs. Digital Solution (How Events Are Captured Currently)
* **Legacy System:** Patrol logs and IUU incident reports are recorded on paper forms. Officers transcribe coordinates manually from handheld GPS devices, introducing typos (transposition errors). Visual proof (photographs) resides on standalone cameras or personal smartphones, disconnected from records. Reports take hours or days to reach command centers.
* **Modern IUU System:** Fully automated track logs, direct image linkage, offline vaulting (buffered locally with instant metadata sync), and real-time alerts. Manual coordinate entry remains as an override for external RTK devices or remote visual sightings.

### 6.2 GPS Geolocation & Coordinate Architecture (WGS84 vs. UTM)
* **Coordinate System Choice:** We record coordinates using the global **WGS84** reference system (latitude and longitude in decimal degrees, EPSG:4326), standard across modern GNSS receivers and consumer hardware.
* **WGS84 vs. UTM:** UTM (Universal Transverse Mercator) is zone-dependent (dividing the globe into 60 local strips). Since marine patrols operate across wide coastal margins that cross boundaries, storing UTM would require complex zone re-projections and complicate web maps. Storing standard float8 WGS84 coordinates allows for:
  1. Seamless, boundary-free visualization using mapping APIs (Leaflet, Mapbox, Google Maps).
  2. Minimal storage overhead and zero projection transform lag inside the PostgreSQL database.
* **Accuracy Configurations:** The app requests native high-precision settings. Operators can adjust the GPS Accuracy settings (`Balanced`, `High`, `Highest`) via the Settings panel to optimize device power consumption (battery life vs. coordinate precision).

### 6.3 AI Subsystem Design & Trade-offs (Commercial VLM vs. Custom Trained Model)
* **Visual Analysis & Report Automation:** The platform consumes a large Vision-Language Model API (VLM like OpenAI GPT-4o) via a strict structured JSON schema. This handles instant object detection (vessels, nets, gear), confidence evaluation, threat assessment, and drafts a ~300-word patrol summary.
* **API-based VLM vs. Custom CNN Model:**
  1. *Training Data Scarcity:* Training a custom visual classification model requires tens of thousands of labeled, high-resolution photos of regional maritime vessels and violations, which are unavailable.
  2. *Zero-Shot Adaptability:* A foundational commercial VLM performs zero-shot detection of visual signs, lighting configurations, and vessel names without retraining.
  3. *Error Containment:* The AI output is treated as a **preliminary suggestion**. System administrators review, edit, and validate all summaries on the web dashboard before formal legal routing, maintaining a strict *Human-in-the-Loop* safety protocol.

### 6.4 Stakeholder Analysis Matrix
* **Field / Patrol Officers:** Use the mobile app to trace patrol tracks, capture visual evidence, log manual/device locations, and queue offline records.
* **HQ Command Administrators:** Use the Next.js web dashboard to review live patrol history, audit syncs, compile analytics, inspect AI suggestions, and export reports.
* **Ministry / Regulatory Agency Sponsors:** Assess compliance patterns, monitor fishing sectors, and allocate fleet/patrol resources dynamically.
* **Legal Investigators & Prosecutors:** Access immutable audit logs and coordinate-verified evidence to support prosecution of maritime infractions.

---

*Generated as project documentation. For setup/run instructions see `README.md` and the schema files at the repository root.*
