# IUU Surveillance and Patrol Monitoring MVP
Monorepo MVP with Expo mobile patrol app and Next.js web dashboard using Supabase.
## Folder structure
```text
root/
  apps/
    mobile/
    web/
  packages/
    ui/
    lib/
```
## Environment setup
Copy the example env files:
- `apps/mobile/.env.example` -> `apps/mobile/.env`
- `apps/web/.env.example` -> `apps/web/.env.local`
## Install
```bash
npm install
```
## Run mobile app
```bash
npm run mobile
```
## Run web dashboard
```bash
npm run web
```
## Notes
- Mobile uses Supabase direct client with email/password auth, patrol tracking, incident reporting, local pending queue, and sync button.
- Web uses `@supabase/ssr` for auth/session and dashboard analytics.
- Replace map placeholders with Mapbox/Google Maps keys when ready.
# Fyp-2026
# iuufyp2026
