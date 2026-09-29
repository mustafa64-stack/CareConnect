# CareConnect

**Team: `#include<tech_squad>`**

> Real-time emergency patient routing and hospital capacity coordination platform.

CareConnect connects field emergency units and regional emergency departments in real time. It evaluates live capacity, clinical specialties, transit delay, and telemetry freshness to route patients to the most appropriate available care facility.

---

## Architecture Overview

- **Dispatcher Operations Console**: Report incidents, evaluate ML-ranked regional hospital facilities with corridor traffic awareness, and track active transport runs in real time.
- **Hospital Command Console**: Live telemetry management (ICU and general beds, oxygen reserves, blood banks), atomic reservation locks, and incoming queue management.
- **Backend & Allocation Engine**: Node.js & Express REST API with Server-Sent Events (SSE) for live streaming, Prisma ORM, and atomic bed reservation transactions.
- **ML Ranking Service**: Python microservice running a calibrated GradientBoosting model with exponential telemetry decay penalty and feature explainability.

---

## Quick Start

### 1. Launch Everything

To start all services concurrently:

```bash
npm run dev
# or
./start.sh
```

This launches:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **ML Service**: [http://localhost:5001](http://localhost:5001)

To gracefully stop all services:
```bash
npm run stop
# or
./stop.sh
```

---

## Running Services Separately

If you prefer to run services in dedicated terminal windows:

### ML Service
```bash
cd ml-service
./venv/bin/python server.py
```
*Listens on port `5001`.*

### Backend Server
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
node index.js
```
*Listens on port `5000`.*

### Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
*Listens on port `5173`.*

---

## Key Features

1. **Traffic & Corridor Aware Routing**: Calculates real road distances, regional peak delay penalties, and route corridor bottlenecks.
2. **Telemetry Freshness Decay**: Applies exponential mathematical decay $\exp(-\Delta t / 30)$ to stale bed data so emergency units are never routed to hospitals with out-of-date records.
3. **Atomic Double-Booking Prevention**: Database transactions ensure concurrent requests for the last remaining critical care bed fail safely without oversaturating facilities.
4. **Live Synchronization**: Server-Sent Events (SSE) provide instant synchronization across dispatch units and emergency departments without manual refresh.
