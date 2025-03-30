#!/bin/bash

# Ensure Puppeteer cache directory exists
mkdir -p /opt/render/.cache/puppeteer

# Install the latest Chrome version for Puppeteer
npx puppeteer browsers install chrome

# Set CHROME_PATH environment variable
export CHROME_PATH=$(npx puppeteer browsers path chrome)

echo "✅ Chrome installed at: $CHROME_PATH"
