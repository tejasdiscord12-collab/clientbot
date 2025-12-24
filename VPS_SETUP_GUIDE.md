# 🚀 Full Step-by-Step VPS Setup Guide

Follow these steps to get your **Nexter Cloud Bot** running 24/7 on a VPS (Ubuntu/Linux).

## Step 1: Login to your VPS
Use a terminal (like Terminal on Mac or PowerShell on Windows) to log in:
```bash
ssh root@YOUR_VPS_IP
```
*(Enter your password when asked)*

## Step 2: Install Node.js & Git
Run these commands one by one:
```bash
sudo apt update
sudo apt install -y nodejs npm git
```

## Step 3: Clone your Bot
Download your code from GitHub to the VPS:
```bash
git clone https://github.com/tejasdiscord12-collab/descact-bot.git
cd descact-bot
```

## Step 4: Install Bot Dependencies
```bash
npm install
```

## Step 5: Secret Files
Create your `.env` and `database.json` manually on the VPS.

### Create .env:
1. Type: `nano .env`
2. Paste your local `.env` content.
3. Save: `CTRL + O`, `Enter`.
4. Exit: `CTRL + X`.

## Step 6: 24/7 Mode (PM2)
```bash
# Install PM2
npm install pm2 -g

# Start the bot
pm2 start src/index.js --name "Nexter-Cloud"

# Set up auto-restart
pm2 startup
pm2 save
```

## 📂 How to Update
When you push changes from your computer to GitHub:

1. **On your VPS:**
   ```bash
   cd descact-bot
   git pull
   pm2 restart Nexter-Cloud
   ```

### Quick Debugging
- Status: `pm2 status`
- Logs: `pm2 logs Nexter-Cloud`

Your bot is now running 24/7! 🚀
