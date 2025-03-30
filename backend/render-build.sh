#!/bin/bash
set -e  # Exit immediately if a command fails

# Install Chrome for Puppeteer
apt update && apt install -y chromium-browser || true

# Install Puppeteer dependencies
npx puppeteer browsers install chrome

