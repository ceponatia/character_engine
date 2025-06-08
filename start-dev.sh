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

# Check if directories exist
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

# Start backend server
echo "📦 Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start and capture port
sleep 3

# Extract backend port from logs
BACKEND_PORT=$(grep -o "port [0-9]*" backend.log | grep -o "[0-9]*" | head -1)
if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT="3001"  # Default fallback
fi

echo "📦 Backend started on port $BACKEND_PORT"

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