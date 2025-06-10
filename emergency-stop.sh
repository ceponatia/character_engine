#!/bin/bash
echo "🚨 EMERGENCY: Stopping all LLM and server processes..."

# Kill Ollama processes
echo "Stopping Ollama..."
pkill -f ollama || echo "No Ollama processes found"

# Kill Bun processes  
echo "Stopping Bun backend..."
pkill -f bun || echo "No Bun processes found"

# Kill Node.js processes (frontend)
echo "Stopping Node.js frontend..."
pkill -f "next dev" || echo "No Next.js processes found"

# Check GPU memory usage
echo "Checking GPU memory..."
nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader || echo "GPU monitoring unavailable"

echo "✅ Emergency stop complete. All processes terminated."
echo "💡 Run 'ps aux | grep -E \"(ollama|bun|node)\"' to verify"