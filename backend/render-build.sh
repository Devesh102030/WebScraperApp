#!/bin/bash

# Ensure Puppeteer cache directory exists
mkdir -p /opt/render/.cache/puppeteer

# Install the latest Chrome version for Puppeteer
npx puppeteer browsers install chrome

# Get the correct Chrome executable path
export CHROME_PATH=$(npx puppeteer browsers path chrome | tail -n 1)

echo "✅ Chrome installed at: $CHROME_PATH"
