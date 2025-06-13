#!/bin/bash

# start-dev.sh - Start development servers for CharacterEngine
# Clean startup script for frontend and backend only

echo "🚀 CharacterEngine Development Server Startup"
echo "=============================================="

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service=$2
    echo "🔍 Checking port $port for $service..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "⚡ Killing existing processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo "✅ Port $port freed"
    else
        echo "✅ Port $port is free"
    fi
}

# Function to kill processes by name pattern
kill_by_pattern() {
    local pattern=$1
    local service=$2
    echo "🔍 Checking for $service processes..."
    
    local pids=$(pgrep -f "$pattern" 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "⚡ Killing existing $service processes..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo "✅ $service processes terminated"
    else
        echo "✅ No $service processes found"
    fi
}

# Kill existing development servers
echo ""
echo "🧹 Cleaning up existing servers..."
kill_port 3000 "Frontend (Next.js)"
kill_port 3002 "Backend (Bun)"
kill_port 5001 "KoboldCpp"

# Kill by process patterns as backup
kill_by_pattern "next" "Next.js"
kill_by_pattern "bun.*dev" "Bun"
kill_by_pattern "node.*next" "Node/Next.js"
kill_by_pattern "koboldcpp" "KoboldCpp"

# Wait for processes to terminate
echo "⏳ Waiting for processes to terminate..."
sleep 2

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "   Please run this script from /home/brian/chatbot/"
    exit 1
fi

if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: frontend or backend directories not found"
    echo "   Please run this script from /home/brian/chatbot/"
    exit 1
fi

echo ""
echo "🚀 Starting development servers..."

# Start KoboldCpp first
echo "🤖 Starting KoboldCpp LLM server..."
cd backend/tools/koboldcpp

# Check if model exists
if [ ! -f "/home/brian/chatbot/backend/lib/models/capybarahermes-2.5-mistral-7b.Q5_K_M.gguf" ]; then
    echo "❌ Error: Model file not found at /home/brian/chatbot/backend/lib/models/capybarahermes-2.5-mistral-7b.Q5_K_M.gguf"
    exit 1
fi

# Start KoboldCpp with optimized chatbot settings
python3 koboldcpp.py \
    --model /home/brian/chatbot/backend/lib/models/capybarahermes-2.5-mistral-7b.Q5_K_M.gguf \
    --port 5001 \
    --host 0.0.0.0 \
    --usecublas \
    --gpulayers -1 \
    --contextsize 8192 \
    --smartcontext \
    --multiuser 4 \
    --usemmap \
    --threads 8 \
    --chatcompletionsadapter "kcpp_adapters/ChatML.json" \
    --defaultgenamt 200 > ../../../koboldcpp.log 2>&1 &

KOBOLD_PID=$!
echo "   KoboldCpp PID: $KOBOLD_PID"
echo "   Logs: koboldcpp.log"

# Wait for KoboldCpp to initialize (CUDA setup takes time)
echo "   Initializing CUDA and loading model... (this may take 30-60 seconds)"
sleep 15

# Check if KoboldCpp started successfully
if kill -0 $KOBOLD_PID 2>/dev/null; then
    echo "✅ KoboldCpp server started successfully"
else
    echo "❌ KoboldCpp server failed to start"
    echo "   Check koboldcpp.log for errors"
    cd ../../..
    exit 1
fi

# Go back to backend directory
cd ../../..

# Start backend server
echo "📡 Starting backend server (Bun)..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

# Start backend with output redirect
bun run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: backend.log"

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully"
else
    echo "❌ Backend server failed to start"
    echo "   Check backend.log for errors"
    cd ..
    exit 1
fi

# Go back to root and start frontend
cd ..
echo ""
echo "🎨 Starting frontend server (Next.js)..."
cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

# Start frontend with output redirect
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: frontend.log"

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server started successfully"
else
    echo "❌ Frontend server failed to start"
    echo "   Check frontend.log for errors"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "🎉 Development servers are running!"
echo "=================================="
echo "🎨 Frontend: http://localhost:3000"
echo "📡 Backend:  http://localhost:3002"
echo "🤖 KoboldCpp: http://localhost:5001"
echo ""
echo "📋 Process Information:"
echo "   Frontend PID: $FRONTEND_PID"
echo "   Backend PID:  $BACKEND_PID"
echo "   KoboldCpp PID: $KOBOLD_PID"
echo ""
echo "📝 Log Files:"
echo "   Frontend: frontend.log"
echo "   Backend:  backend.log"
echo "   KoboldCpp: koboldcpp.log"
echo ""
echo "🛑 To stop servers: Press Ctrl+C"
echo ""
echo "✨ Happy coding!"
echo ""

# Function to cleanup servers on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $FRONTEND_PID $BACKEND_PID $KOBOLD_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Monitor servers and keep script alive
echo "📡 Monitoring servers... (Press Ctrl+C to stop)"
echo "=================================================="
while true; do
    # Check if servers are still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend server stopped unexpectedly"
        echo "   Check frontend.log for errors"
        exit 1
    fi
    
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend server stopped unexpectedly"
        echo "   Check backend.log for errors"
        exit 1
    fi
    
    if ! kill -0 $KOBOLD_PID 2>/dev/null; then
        echo "❌ KoboldCpp server stopped unexpectedly"
        echo "   Check koboldcpp.log for errors"
        exit 1
    fi
    
    # Wait 10 seconds before checking again
    sleep 10
done