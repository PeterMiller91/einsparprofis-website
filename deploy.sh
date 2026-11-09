#!/bin/bash
set -e

echo "==> Installing dependencies..."
npm ci --include=dev

echo "==> Building static export..."
npm run build

echo "==> Done. Serve files from the 'out/' directory."
