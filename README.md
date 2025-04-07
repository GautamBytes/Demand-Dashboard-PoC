# DMND Pool Transaction Dashboard

A proof‑of‑concept Stratum V2 dashboard that lets Bitcoin miners pick their own mempool transactions for job declaration. Built with Rust/Axum backend and React/MUI frontend.

## 🚀 Key Features

- **Testnet Mempool Feed**  
  Fetches the latest 25 TXIDs from `mempool.space` (Testnet) every 15 s.

- **Real‑time Updates**  
  Broadcasts mempool snapshots over WebSocket (`/ws`) for live UI refresh.

- **Manual & Auto Selection**  
  Pick transactions by checkbox or auto‑select top N by fee‑rate, age, or size.

- **Stats Panel**  
  Fee‑rate histogram with selected‑range highlight, projected BTC reward (fees + 6.25 BTC subsidy), and block‑usage gauge.

- **Job Declaration**  
  Simulates Stratum V2 Job Declaration: POST your coinbase + selected TXIDs to `/job_declare` and receive a job ID + header template.


## 📁 Directory Structure

```
|── Cargo.toml
|── Cargo.lock
|── src/
│   └── main.rs
├── dashboard-frontend/
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── theme.ts
│   │   ├── vite-env.d.ts
│   │   ├── components/
│   │   │   ├── SelectionControls.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── contexts/
│   │   │   └── MempoolContext.tsx
│   │   └── assets/
│   │       ├── react.svg
│   │       └── vite.svg
├── .gitignore
└── README.md
```

> **Note:** We treat `dashboard-frontend` as the frontend directory in this tree.

## 🛠️ Prerequisites

- **Rust & Cargo** ≥1.70  
- **Node.js** ≥16 LTS & **npm** (or Yarn)


## ⚙️ Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/<you>/dmnd-pool-dashboard.git
cd dmnd-pool-dashboard
```

### 2. Backend

```bash
cargo build --release
cargo run --release
```

- **HTTP API** on `http://localhost:3000`  
  - `GET  /transactions` → JSON array of 25 mempool TXs (fee_rate, size, inputs, outputs, age)  
  - `GET  /selected`      → current selected TXIDs  
  - `POST /selected`      → update selected TXIDs  
  - `POST /job_declare`   → `{ coinbase, txids }` → `{ job_id, header_template }`  

- **WebSocket** on `ws://localhost:3000/ws`  
  Broadcasts `Vec<MempoolTransaction>` every 15 s.

### 3. Frontend

```bash
cd ../dashboard-frontend
npm install
npm run dev
```

- **UI** at `http://localhost:5173` (Vite default)  
- Connects to backend at `localhost:3000`

---

## 🧩 Technical Breakdown

### Backend (`backend/src/main.rs`)

- **`fetch_real_mempool()`**  
  - Calls `https://mempool.space/testnet/api/mempool/txids`  
  - For each of the first 25 TXIDs, fetches `/api/tx/{txid}` to compute `fee_rate`, `size`, `inputs`, `outputs`, and `age` (minutes).

- **AppState**  
  - `selected_txs`: `Mutex<Vec<String>>`  
  - `tx_sender`: broadcast channel for `Vec<MempoolTransaction>`

- **Routes**  
  - `/transactions`, `/selected`, `/job_declare`, `/ws`

- **WebSocket Broadcast**  
  - Spawns a Tokio task that every 15 s fetches mempool and `tx_sender.send(...)`

### Frontend (`dashboard-frontend/src/`)

- **`MempoolContext.tsx`**  
  - Holds `transactions`, `selected`, `loading`, `error`  
  - Connects WebSocket → updates `transactions`  
  - Fallback polling every 15 s via `refresh()`  
  - `autoSelect(strategy, count)`, `setSelected`, `submitSelection()`

- **`SelectionControls.tsx`**  
  - UI for auto‑select buttons (feeRate, age, size)  
  - “Declare Job” flow: opens dialog → POST `/job_declare` → show job ID & header

- **`StatsPanel.tsx`**  
  - Calculates totals: fees (sat), avg/max fee‑rate, total size, projected BTC reward  
  - Builds a 15‑bin fee‑rate histogram; highlights selected range  
  - Block‑usage gauge: `totalSize / 1_000_000`

- **`TransactionList.tsx`**  
  - MUI `DataGrid` of TXs with checkbox selection  
  - Row click → detail dialog (all fields)

- **`App.tsx`**  
  - MUI AppBar + left/right sidebars (static pool stats & recent activity)  
  - Central container with `StatsPanel`, `SelectionControls`, `TransactionList`  
  - Toast notifications for feedback


