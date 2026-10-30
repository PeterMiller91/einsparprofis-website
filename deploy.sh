#!/bin/bash
set -e

echo "==> Installing dependencies..."
npm ci --include=dev

echo "==> Building application..."
npm run build

echo "==> Done."
