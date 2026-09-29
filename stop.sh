#!/bin/bash

echo "Stopping Golden Hour services..."

# Kill any existing processes running on the standard ports
fuser -k 5001/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

echo "All Golden Hour services stopped."
