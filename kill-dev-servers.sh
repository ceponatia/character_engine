#!/bin/bash

# Kill Development Servers Script
# This script finds and kills processes using backend, frontend, and Ollama ports

echo "🔍 Scanning for development server processes..."
echo ""

# Define the ports to check
BACKEND_PORT=3002    # Hono + Bun backend
FRONTEND_PORT=3000   # Next.js frontend
OLLAMA_PORT=11434    # Ollama LLM server

# Function to kill processes on a specific port (more aggressive)
kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking port $port ($service_name)..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "🎯 Found processes on port $port:"
        # Show what processes are running
        lsof -i:$port 2>/dev/null | head -10
        echo ""
        
        # Kill the processes more aggressively
        for pid in $pids; do
            local process_name=$(ps -p $pid -o comm= 2>/dev/null)
            local process_cmd=$(ps -p $pid -o args= 2>/dev/null | cut -c1-50)
            echo "💀 Killing $process_name (PID: $pid) - $process_cmd"
            
            # Kill process and all its children
            pkill -TERM -P $pid 2>/dev/null
            kill -TERM $pid 2>/dev/null
        done
        
        # Wait a moment for graceful shutdown
        sleep 3
        
        # Force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            echo "🔨 Force killing remaining processes on port $port..."
            for pid in $remaining_pids; do
                pkill -KILL -P $pid 2>/dev/null
                kill -KILL $pid 2>/dev/null
            done
            sleep 1
        fi
        
        # Final port check
        if lsof -i:$port >/dev/null 2>&1; then
            echo "❌ Port $port still in use - trying system-level kill..."
            # Last resort: use fuser to kill
            fuser -k $port/tcp 2>/dev/null || true
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is already free"
    fi
    echo ""
}

# Function to kill Ollama by process name (in case it's not bound to port)
kill_ollama_processes() {
    echo "🔍 Checking for Ollama processes..."
    
    local ollama_pids=$(pgrep -f "ollama")
    
    if [ -n "$ollama_pids" ]; then
        echo "🎯 Found Ollama processes:"
        ps aux | grep "[o]llama" | head -10
        echo ""
        
        for pid in $ollama_pids; do
            local process_name=$(ps -p $pid -o args= 2>/dev/null | cut -d' ' -f1)
            echo "💀 Killing Ollama process (PID: $pid) - $process_name"
            kill -TERM $pid 2>/dev/null
        done
        
        # Wait for graceful shutdown
        sleep 3
        
        # Force kill if still running
        local remaining_pids=$(pgrep -f "ollama")
        if [ -n "$remaining_pids" ]; then
            echo "🔨 Force killing remaining Ollama processes..."
            pkill -KILL -f "ollama"
        fi
        
        if pgrep -f "ollama" >/dev/null; then
            echo "❌ Some Ollama processes still running"
        else
            echo "✅ All Ollama processes stopped"
        fi
    else
        echo "✅ No Ollama processes found"
    fi
    echo ""
}

# Function to kill Docker containers
kill_docker_containers() {
    echo "🔍 Checking for Docker containers..."
    
    # Check for Ollama Docker container
    if docker ps -q --filter "name=ollama-chatbot" | grep -q .; then
        echo "🎯 Found Ollama Docker container"
        echo "🐳 Stopping ollama-chatbot container..."
        docker stop ollama-chatbot >/dev/null 2>&1
        docker rm ollama-chatbot >/dev/null 2>&1
        echo "✅ Ollama Docker container stopped and removed"
    else
        echo "✅ No Ollama Docker containers found"
    fi
    
    # Check for any containers using our ports
    for port in $BACKEND_PORT $FRONTEND_PORT $OLLAMA_PORT; do
        local container_ids=$(docker ps -q --filter "publish=$port")
        if [ -n "$container_ids" ]; then
            echo "🎯 Found Docker containers using port $port"
            for container_id in $container_ids; do
                local container_name=$(docker ps --format "table {{.Names}}" --filter "id=$container_id" | tail -n +2)
                echo "🐳 Stopping container: $container_name ($container_id)"
                docker stop $container_id >/dev/null 2>&1
            done
        fi
    done
    echo ""
}

# Function to kill Node.js development servers (more comprehensive)
kill_node_processes() {
    echo "🔍 Checking for Node.js development processes..."
    
    # More comprehensive patterns to catch all dev servers
    local patterns=(
        "npm.*dev"
        "next.*dev" 
        "bun.*dev"
        "next-server"
        "node.*next"
        "node.*dev"
    )
    
    for pattern in "${patterns[@]}"; do
        local pids=$(pgrep -f "$pattern" 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "🎯 Found processes matching '$pattern':"
            ps aux | grep -E "[$pattern]" | head -5
            
            for pid in $pids; do
                local process_cmd=$(ps -p $pid -o args= 2>/dev/null | cut -c1-60)
                echo "💀 Killing: $process_cmd (PID: $pid)"
                
                # Kill process tree
                pkill -TERM -P $pid 2>/dev/null
                kill -TERM $pid 2>/dev/null
            done
        fi
    done
    
    sleep 3
    
    # Force kill any remaining development processes
    echo "🔨 Force killing any remaining development processes..."
    pkill -KILL -f "npm.*dev" 2>/dev/null || true
    pkill -KILL -f "next.*dev" 2>/dev/null || true
    pkill -KILL -f "bun.*dev" 2>/dev/null || true
    pkill -KILL -f "next-server" 2>/dev/null || true
    pkill -KILL -f "node.*next" 2>/dev/null || true
    
    # Also kill any node processes in our project directory
    echo "🔨 Killing Node processes in project directory..."
    ps aux | grep -E "node.*chatbot" | grep -v grep | awk '{print $2}' | xargs -r kill -KILL 2>/dev/null || true
    
    echo "✅ Node.js development processes cleaned up"
    echo ""
}

# Main execution
echo "🧹 Development Server Cleanup Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Kill Docker containers first
kill_docker_containers

# Kill processes by port
kill_port $BACKEND_PORT "Backend (Hono/Bun)"
kill_port $FRONTEND_PORT "Frontend (Next.js)"
kill_port $OLLAMA_PORT "Ollama LLM Server"

# Kill Ollama by process name (backup)
kill_ollama_processes

# Kill Node.js dev processes
kill_node_processes

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Cleanup completed!"
echo ""
echo "📊 Final port status:"
for port in $BACKEND_PORT $FRONTEND_PORT $OLLAMA_PORT; do
    if lsof -i:$port >/dev/null 2>&1; then
        echo "❌ Port $port: Still in use"
    else
        echo "✅ Port $port: Free"
    fi
done
echo ""
echo "🚀 You can now run ./start-dev.sh or ./start-dev-safe.sh"