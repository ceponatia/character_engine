#!/bin/bash

# Complete Development Server Restart Script
# This script kills all processes, waits for ports to be free, then starts fresh

echo "🔄 Restarting Development Servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Kill all existing processes
echo "🧹 Step 1: Cleaning up existing processes..."
./kill-dev-servers.sh

# Step 2: Wait for ports to be completely free
echo "⏳ Step 2: Waiting for ports to be free..."
for i in {1..10}; do
    if ! lsof -i:3000 -i:3002 >/dev/null 2>&1; then
        echo "✅ Ports are free"
        break
    fi
    echo "⏳ Waiting for ports to be freed... ($i/10)"
    sleep 2
done

# Step 3: Verify ports are actually free
if lsof -i:3000 -i:3002 >/dev/null 2>&1; then
    echo "❌ Ports still in use after cleanup! Manual intervention needed:"
    lsof -i:3000 -i:3002
    echo ""
    echo "Try running: sudo lsof -ti:3000,3002 | xargs sudo kill -9"
    exit 1
fi

# Step 4: Start fresh
echo "🚀 Step 3: Starting fresh development servers..."
echo ""
./start-dev.sh

echo ""
echo "✅ Restart complete!"