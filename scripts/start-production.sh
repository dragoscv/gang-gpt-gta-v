#!/bin/bash

# Production startup script for GangGPT
# This script starts both the backend and frontend services with monitoring

set -e

# Set default environment variables if not provided
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export LOG_LEVEL=${LOG_LEVEL:-info}

echo "🚀 Starting GangGPT Production Services (v1.0.0)..."
echo "⚙️  Environment: $NODE_ENV"

# Check for critical environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$AZURE_OPENAI_API_KEY" ]; then
  echo "⚠️  WARNING: AZURE_OPENAI_API_KEY is not set. AI features will not work correctly."
fi

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Migration failed, continuing anyway..."

# Create log directory if it doesn't exist
mkdir -p logs

# Start backend in background with production optimizations
echo "🔧 Starting backend server on port $PORT..."
NODE_ENV=$NODE_ENV \
NODE_OPTIONS="--max-old-space-size=2048" \
node dist/server.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:$PORT/health > /dev/null; then
    echo "✅ Backend is ready!"
    break
  fi
  echo "⏳ Still waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Backend failed to start within the expected time"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi

# Start frontend in production mode
echo "🌐 Starting frontend server on port $FRONTEND_PORT..."
cd web && \
PORT=$FRONTEND_PORT \
NODE_ENV=$NODE_ENV \
NODE_OPTIONS="--max-old-space-size=1024" \
npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

# Setup signal handlers
trap cleanup SIGTERM SIGINT

echo ""
echo "✅ GangGPT is running!"
echo "🔧 Backend: http://localhost:$PORT"
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "📊 Health: http://localhost:$PORT/health"
echo "📈 Metrics: http://localhost:$PORT/metrics"
echo "📝 Logs: ./logs/"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait
