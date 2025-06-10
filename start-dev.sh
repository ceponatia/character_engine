#!/bin/bash

# RPG Chatbot Development Server Startup Script
# This script starts both the frontend and backend development servers

echo "🚀 Starting RPG Chatbot Development Servers..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill
    # Clean up log files
    rm -f backend.log frontend.log
    wait
    echo "✅ All servers stopped"
    exit 0
}

# Set up cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Ollama server if not running
echo "🤖 Starting Ollama server..."
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve > /dev/null 2>&1 &
    sleep 3
    echo "🤖 Ollama server started"
else
    echo "🤖 Ollama server already running"
fi

# Load Pygmalion2 model
echo "🧠 Loading Pygmalion2-7B model..."
ollama run pygmalion2-7b --keepalive 0 > /dev/null 2>&1 &
sleep 2
echo "🧠 Pygmalion2-7B model loaded and ready"

# Check if directories exist
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

# Check if backend port is available
if lsof -i:3002 >/dev/null 2>&1; then
    echo "❌ Port 3002 is already in use! Run ./kill-dev-servers.sh first"
    lsof -i:3002
    exit 1
fi

# Start backend server
echo "📦 Starting backend server..."
cd backend

# Check if bun is available, otherwise use npm
if command -v bun >/dev/null 2>&1; then
    echo "📦 Using Bun runtime..."
    bun run dev > ../backend.log 2>&1 &
else
    echo "📦 Using npm runtime..."
    npm run dev > ../backend.log 2>&1 &
fi

BACKEND_PID=$!
cd ..

# Wait for backend to start and capture port
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend process is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend process died! Check logs:"
    if [ -f "backend.log" ]; then
        tail -20 backend.log
    fi
    exit 1
fi

# Extract backend port from logs (updated for Hono output)
BACKEND_PORT=$(grep -o "port [0-9]*\|:[0-9]*" backend.log | grep -o "[0-9]*" | head -1)
if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT="3002"  # Updated default for Hono
fi

echo "📦 Backend started on port $BACKEND_PORT (PID: $BACKEND_PID)"

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start and capture port
sleep 5

# Extract frontend port from logs (Next.js format: "Local: http://localhost:XXXX")
FRONTEND_PORT=$(grep -o "Local.*localhost:[0-9]*" frontend.log | grep -o "[0-9]*" | head -1)
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT="3000"  # Default fallback
fi

echo "🎨 Frontend started on port $FRONTEND_PORT"

echo ""
echo "✅ Development servers started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend:  http://localhost:$BACKEND_PORT"
echo "❤️  Health:   http://localhost:$BACKEND_PORT/health"
echo "👥 Characters: http://localhost:$BACKEND_PORT/api/characters"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Show live logs from both servers
echo "📋 Live server output:"
echo "─────────────────────────────────────────"
tail -f backend.log frontend.log &
TAIL_PID=$!

# Wait for user to stop the script
wait