#!/bin/bash
# Install Chrome for Puppeteer
curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo apt update
sudo apt install -y chromium-browser

# Install Puppeteer dependencies
npx puppeteer browsers install chrome
