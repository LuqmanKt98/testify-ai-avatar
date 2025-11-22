#!/bin/bash

# Testify Backend Setup Script

echo "🚀 Setting up Testify Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your API keys"
else
    echo "✅ .env file already exists"
fi

# Test the server
echo "🧪 Testing server startup..."
timeout 10s npm start > /dev/null 2>&1 &
SERVER_PID=$!

sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🎉 Testify Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - OPENAI_API_KEY=your_openai_api_key_here"
echo "   - HEYGEN_API_KEY=your_heygen_api_key_here"
echo ""
echo "2. Start the server:"
echo "   npm run dev    # Development mode"
echo "   npm start      # Production mode"
echo ""
echo "3. Test the API:"
echo "   curl http://localhost:3001/health"
echo ""
echo "📚 See README.md for detailed documentation"
