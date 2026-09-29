#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Launching CareConnect Emergency Allocation Services..."

"$DIR/ml-service/venv/bin/python" "$DIR/ml-service/server.py" &
ML_PID=$!

node "$DIR/backend/index.js" &
BACKEND_PID=$!

cd "$DIR/frontend"
npm run dev -- --host &
FRONTEND_PID=$!

cleanup() {
  echo "Shutting down active services..."
  kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "Active endpoints:"
echo "  Frontend:   http://localhost:5173"
echo "  Backend:    http://localhost:5000"
echo "  ML Service: http://localhost:5001"

wait
