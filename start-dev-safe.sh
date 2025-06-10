#!/bin/bash

# RPG Chatbot Development Server Startup Script (With Safe Ollama)
# This script starts Ollama in Docker with memory limits, then starts dev servers

echo "🚀 Starting RPG Chatbot Development Servers (Safe Mode)..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    # Stop Docker container
    docker-compose -f docker-compose.ollama.yml down > /dev/null 2>&1
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

# Start Ollama in Docker with memory limits
echo "🐳 Starting Ollama server in Docker (5GB RAM limit)..."
if ! docker-compose -f docker-compose.ollama.yml up -d; then
    echo "❌ Error: Failed to start Ollama Docker container"
    exit 1
fi

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 10

# Check if Ollama is responding
until curl -s http://localhost:11434/api/tags > /dev/null; do
    echo "⏳ Waiting for Ollama API..."
    sleep 2
done

echo "🤖 Ollama server started successfully with memory protection"

# Check if Pygmalion2 model exists, if not pull it
echo "🧠 Checking Pygmalion2 model..."
if docker exec ollama-chatbot ollama list | grep -q "mattw/pygmalion2"; then
    echo "🧠 Pygmalion2 model already available"
else
    echo "🧠 Downloading Pygmalion2 model..."
    docker exec ollama-chatbot ollama pull mattw/pygmalion2
fi

# Preload the model for faster responses
echo "🧠 Preloading Pygmalion2 model..."
docker exec ollama-chatbot ollama run mattw/pygmalion2 --keepalive 30s <<< "Hello" > /dev/null 2>&1 &
echo "🧠 Pygmalion2 model ready"

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
    BACKEND_PORT="3002"  # Default fallback for Hono
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
echo "✅ Development servers started successfully with memory protection!"
echo ""
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend:  http://localhost:$BACKEND_PORT"
echo "🤖 Ollama:   http://localhost:11434 (Docker, 5GB RAM limit)"
echo "❤️  Health:   http://localhost:$BACKEND_PORT/health"
echo "👥 Characters: http://localhost:$BACKEND_PORT/api/characters"
echo ""
echo "🛡️  Memory Protection: Ollama limited to 5GB RAM"
echo "🐳 Container Status: docker-compose -f docker-compose.ollama.yml ps"
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