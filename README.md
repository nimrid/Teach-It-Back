# Teach It Back 🎓⚡
> **A Study-Accountability Mini App for Nimiq Pay (Nimiq Mini Apps Competition — Cycle III)**

Learners solidify their understanding of technical topics by producing short, crisp explainers (video/audio, blog/writeup, or direct formatted text). The community backs the clearest explainers with micro-payments in NIM, creating a live Community Pool that highlights who explained the concept best.

> **Important Economic Design**: **Backers get no financial return.** Backing is a one-way micro-tip and vote for clarity. The Community Pool reflects pure community appreciation and validation of useful explanations, and 100% of backed funds go directly to the teachers.

---

## ✨ Features & Capabilities

- **18 Curated Topics Across 6 Learning Pathways**:
  - 🟢 **Simple**: Basics of NIM, Nimiq wallets, hardware-free consensus.
  - 🔵 **Easy**: In-browser nodes, staking basics, Nimiq Pay Mini Apps.
  - 🟡 **Medium**: Proof-of-Stake transition, validators vs. stakers, sub-second finality.
  - 🟠 **Medium-hard**: Micro vs. macro blocks, skip blocks, validator slashing.
  - 🔴 **Hard**: Albatross epochs & batches, 2-step macro voting, 3f+1 BFT guarantees.
  - 🟣 **Expert**: Election macro blocks, ZK-SNARKs (Groth16/Arkworks) epoch compression, high-TPS architectural trade-offs.

- **Multi-Format Submissions**:
  - 🎬 **Video / Audio Link**: Direct links to YouTube, Loom, Vimeo, etc., with automatic embedded player.
  - 📄 **Blog / Article Link**: Links to Substack, Medium, Mirror, Dev.to, or personal sites with preview card.
  - ✍️ **Direct Written Text**: In-app markdown-formatted articles with character counter and reader mode.

- **1-Tap Micro-Backing via Nimiq Pay**:
  - Native transactions via `@nimiq/mini-app-sdk` with custom tag data: `back:{topicId}:{explainerId}`.
  - Preset quick-tip tiers: **1 NIM**, **5 NIM**, and **10 NIM**.
  - All transactions handled in Luna denomination ($1\text{ NIM} = 100,000\text{ Luna}$).

- **Autonomous Background Indexer**:
  - Real-time polling daemon connecting to Nimiq Albatross RPC (`https://rpc.testnet.nimiqwatch.com/`).
  - Automatically indexes incoming transactions to the treasury address (`NQ80 TEAC H1TB ACK7 REAS URYT ESTN ETVA LADA`), decodes payload tags, and credits backing tallies.

- **Anti-Abuse & Wallet Safety**:
  - **Self-backing detection**: Backings originating from an explainer's own payout address are excluded from the prize calculation.
  - **IBAN Address Checksum Validation**: `@nimiq/utils/validation-utils` ensures no funds are sent to malformed addresses.
  - **Address Book Warning**: `@nimiq/utils/address-book` detects known pool/exchange addresses and alerts the user.
  - **Per-origin rate-limiting**: Integrated with `requestDeviceIdentifier` to prevent spam submissions.

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons
- **Nimiq SDK**: `@nimiq/mini-app-sdk`, `@nimiq/utils`
- **Backend API & Indexer**: Node.js (Node 23 built-in `node:sqlite`), Express, tsx
- **RPC Endpoint**: Nimiq Testnet Albatross RPC (`https://rpc.testnet.nimiqwatch.com/`)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Backend API & Indexer
```bash
pnpm server
```
*Runs on `http://0.0.0.0:3001` and connects to SQLite at `data/teach_it_back.sqlite`.*

### 3. Start Frontend Dev Server
```bash
pnpm dev --host
```
*Runs on `http://0.0.0.0:5173` (accessible over local Wi-Fi).*

### 4. Open Inside Nimiq Pay
1. Open **Nimiq Pay** on your mobile device (connected to the same Wi-Fi).
2. Go to **Settings > Developer Settings**.
3. Enter your computer's local IP URL: `http://<your-lan-ip>:5173`.
4. The Mini App opens in full-screen WebView with the Nimiq provider injected.

*(If opened in a standard desktop browser, the app runs in demo mode with pre-configured mock wallets for inspection.)*

---

## 🏗 Architecture & Code Structure

```
charming-borg/
├── server/
│   ├── db.ts           # SQLite schema, curated topics & sample explainers
│   ├── indexer.ts      # Polling daemon querying Albatross RPC & decoding tags
│   └── index.ts        # Express REST API & round payout distribution logic
├── src/
│   ├── hooks/
│   │   └── useNimiq.ts # Injected Nimiq provider hook with timeout & device ID
│   ├── App.tsx         # Mobile-first UI, category filters, modals, submission
│   ├── main.tsx        # React root entry point
│   └── index.css       # Tailwind CSS styles & mobile touch optimizations
├── package.json
└── vite.config.ts
```

---

## 🔒 Security & Sandboxing Compliance

1. **Zero Private Key Access**: Keys never leave Nimiq Pay. Transactions are constructed in-app and dispatched via `provider.sendBasicTransactionWithData()` for native biometric/PIN confirmation.
2. **Explicit User Intent**: No transaction dialogs trigger automatically on page load; confirmations are only dispatched on user tap.
3. **Touch Targets & Viewport**: Designed strictly mobile-first with minimum $44\text{px}$ touch targets and safe area margins.

---

## 🚢 Production Deployment (Testnet Mode)

The application is pre-configured with **Nimiq Testnet** defaults:
- **Treasury Address**: `NQ80 TEAC H1TB ACK7 REAS URYT ESTN ETVA LADA`
- **Albatross RPC**: `https://rpc.testnet.nimiqwatch.com/`
- **Server Port**: `3001` (or dynamic `$PORT`)

### Option A: Render (Free Plan with Supabase - No Disks Required!)
1. In your **Supabase Dashboard** (`https://supabase.com/dashboard/project/gfsiiwhiajojqaxdtdmc`):
   - Go to **SQL Editor > New Query**.
   - Copy & paste the contents of [`supabase/schema.sql`](file:///Users/hng/Documents/antigravity/charming-borg/supabase/schema.sql) and click **Run**.
   - This creates all 4 tables (`topics`, `explainers`, `transactions`, `payouts`) with public read and service-role policies.
2. Push this repository to GitHub.
3. In your **Render Dashboard**, click **New > Blueprint**.
4. Select this repo — Render reads [`render.yaml`](file:///Users/hng/Documents/antigravity/charming-borg/render.yaml), provisions the web service on the **Free Plan** (no disk needed), injects your Supabase environment variables, builds the frontend, and launches the server.
5. Your live HTTPS URL (e.g. `https://teach-it-back.onrender.com`) is ready to load inside Nimiq Pay! All topics and explainers persist permanently in Supabase across restarts.

### Option B: Fly.io
```bash
fly launch
fly volumes create tib_data --size 1
fly deploy
```

### Option C: Docker / VPS
```bash
# Build production image
docker build -t teach-it-back .

# Run container with persistent data volume
docker run -d \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e ADMIN_API_KEY=your-secure-admin-secret \
  --name teach-it-back \
  teach-it-back
```

### Option D: Manual Production Run
```bash
pnpm install
pnpm build
pnpm start
```
*The Express server serves the compiled `dist/` frontend, handles API requests, enforces rate-limiting, and runs the Albatross RPC indexer on a single unified port.*

---

## 🔐 Admin Operations (Closing Rounds)

To close an expired round and calculate proportional pool distributions:
```bash
curl -X POST https://<your-domain>/api/admin/close-round \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_API_KEY>" \
  -d '{"topicId":"topic-simple-1"}'
```

---

## 📜 License
MIT License

