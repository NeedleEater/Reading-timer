# Neon Reading Log

A production-quality reading session tracker built with React, Vite, and Cloudflare Pages Functions.

## Features
- **Neon to Noir UI**: A striking visual shift when the timer is active.
- **Timer Workflow**: Start/Stop tracking with local state persistence (reloads don't break the timer).
- **History View**: Monthly calendar with daily totals.
- **Stats**: Real-time weekly and monthly totals.
- **CSV Export**: Export any month's data for external analysis.
- **Mobile Friendly**: Fully responsive design.

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Lucide Icons.
- **Backend**: Cloudflare Pages Functions (Serverless).
- **Database**: Cloudflare D1 (SQLite).
- **Styling**: Plain CSS with CSS Variables.

---

## Local Development

### Prerequisites
- Node.js (v18+)
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the local D1 database:
   ```bash
   wrangler d1 execute reading-log-db --local --file=./schema.sql
   ```
4. Run the development server (Vite + Wrangler Pages):
   ```bash
   # In one terminal, run Vite
   npm run dev
   
   # In another terminal, run Wrangler to proxy functions
   wrangler pages dev ./dist --d1 DB=reading-log-db
   ```
   *Note: For a unified experience, you can use `wrangler pages dev` which will handle the build.*

---

## Cloudflare Pages Deployment

### 1. Create D1 Database
Create a new D1 database via the Cloudflare Dashboard or CLI:
```bash
wrangler d1 create reading-log-db
```

### 2. Run Migrations
Apply the schema to your production database:
```bash
wrangler d1 execute reading-log-db --remote --file=./schema.sql
```

### 3. Deploy to Cloudflare Pages
1. Push your code to GitHub/GitLab.
2. Connect your repository to Cloudflare Pages.
3. **Build Settings**:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Functions Configuration**:
   - In the Pages project settings, go to **Functions** -> **D1 database bindings**.
   - Add a binding named `DB` and select your `reading-log-db`.

### 4. Environment Variables
If you add any secrets later, add them in the Pages dashboard under **Settings** -> **Environment variables**.

---

## Troubleshooting

- **D1 Binding Error**: Ensure the binding name in `wrangler.toml` or the Cloudflare Dashboard is exactly `DB`.
- **Timer Reset**: If the timer resets on reload, check if your browser allows `localStorage`.
- **CORS Issues**: When running locally, ensure you are accessing the app through the Wrangler proxy port (usually `8788`), not the Vite port (`3000`).
