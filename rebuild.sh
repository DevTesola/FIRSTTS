#!/bin/bash
# Full rebuild and restart script

echo "🔄 Full Next.js rebuild and restart script"
echo "=========================================="

# 1. Stop any running Next.js server
echo "📌 Stopping any running Next.js processes..."
pkill -f "node.*next"
echo "✅ Stopped processes"

# 2. Clean Next.js build cache
echo "🧹 Cleaning Next.js cache..."
rm -rf .next
echo "✅ Removed .next directory"

# 3. Clean node_modules (optional - uncomment if needed)
# echo "🧹 Cleaning node_modules..."
# rm -rf node_modules
# echo "✅ Removed node_modules"

# 4. Reinstall dependencies (optional - uncomment if needed)
# echo "📦 Reinstalling dependencies..."
# npm ci
# echo "✅ Dependencies reinstalled"

# 5. Rebuild Next.js
echo "🔨 Rebuilding Next.js application..."
npm run build
echo "✅ Rebuild complete"

# 6. Start server in development mode
echo "🚀 Starting server in development mode..."
npm run dev &

echo -e "\n✨ Done! Next.js server should now be running with all changes applied"
echo "💡 If problems persist, you may need to:"
echo "   1. Check server logs for errors"
echo "   2. Verify changes to constants.js are correct"
echo "   3. Try a complete 'npm ci' to reinstall all dependencies"