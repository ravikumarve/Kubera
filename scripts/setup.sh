#!/bin/bash
echo "🚀 Setting up KUBERA development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker required"; exit 1; }

# Start infrastructure
echo "🐳 Starting PostgreSQL and Redis..."
docker compose -f infra/docker-compose.dev.yml up -d

# Backend setup
echo "🔧 Setting up backend..."
cd backend
pip install poetry 2>/dev/null
poetry install
cp .env.example .env 2>/dev/null
echo "⚠️  Edit backend/.env with your configuration"
poetry run alembic upgrade head
cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend
npm install
cp .env.local.example .env.local 2>/dev/null
echo "⚠️  Edit frontend/.env.local with your configuration"
cd ..

echo ""
echo "✅ Setup complete!"
echo "   Backend: cd backend && poetry run uvicorn app.main:app --reload --port 8000"
echo "   Frontend: cd frontend && npm run dev"
echo "   Docs: http://localhost:8000/docs"
