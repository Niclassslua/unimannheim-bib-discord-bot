<p align="center">
  <img width="504" height="110" alt="image" src="https://github.com/user-attachments/assets/fe3d10b5-6200-4726-acc0-55130d4d9c7b" />
</p>

<span align="center">

# 📚🤖 Uni Mannheim Library Occupancy Bot
### A *Discord bot* that tracks seat availability in the *University of Mannheim* libraries (A3, A5, Ehrenhof, Schneckenhof). It updates Discord with live embeds and saves occupancy data to MySQL for analysis.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Last Commit](https://img.shields.io/github/last-commit/Niclassslua/unimannheim-bib-discord-bot)

</span>

---

## 📑 Table of Contents
- [📸 Preview](#-preview)
- [✨ Features](#-features)
- [🚀 Getting Started](#-getting-started)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Install dependencies](#2-install-dependencies)
    - [3. Create a Discord Bot](#3-create-a-discord-bot)
    - [4. Configure environment](#4-configure-environment)
- [▶️ Running the Bot](#️-running-the-bot)
- [🐳 Running with Docker](#-running-with-docker)
    - [Option A — Bot only (no database)](#option-a--bot-only-no-database)
    - [Option B — Bot + bundled MySQL (self-hosted)](#option-b--bot--bundled-mysql-self-hosted)
    - [Automatic updates from GitHub (Watchtower)](#automatic-updates-from-github-watchtower)
- [🛠️ Configuration](#️-configuration)
    - [Environment Variables](#environment-variables-env)
    - [Database Schema](#database-schema)
- [💡 Ideas for Extensions](#-ideas-for-extensions)
- [⚖️ Legal & Ethical Notes](#️-legal--ethical-notes)
- [📜 License](#-license)

---

## 📸 Preview

*Here’s how the bot looks in action:*

<img width="573" height="331" alt="image" src="https://github.com/user-attachments/assets/64506efb-699d-4bfe-8d2e-1fc1ce3170f9" />

---

## ✨ Features

- 🔄 **Automatic updates** every 2.5 minutes
- 🕔 **Live opening hours** directly scraped from each library page
- 🪑 **Seats information**: occupied, free, and percentage
- 📌 **Location info** for each library branch
- 📊 **MySQL persistence** for later analysis and visualization
- 🎭 **Fun rotating status messages** (e.g. “listening to loud students in the library”)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/niclassslua/unimannheim-bib-discord-bot.git
cd unimannheim-bib-discord-bot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a Discord Bot
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** → give it a name → **Create**.
3. Navigate to **Bot** → click **Add Bot**.
4. Copy the **Bot Token** (use this in your `.env` file as `DISCORD_TOKEN`).
5. Under **Privileged Gateway Intents**, enable:
    - ✅ Message Content Intent
    - ✅ Server Members Intent
6. Under **OAuth2 → URL Generator**:
    - Select **bot** and **applications.commands**.
    - Under Bot Permissions, choose:
        - Send Messages
        - Embed Links
        - Read Message History
    - Copy the generated URL and add the bot to your server.

### 4. Configure environment
Copy the provided `.env.example` and fill in your own values:

```bash
cp .env.example .env
```

Edit `.env` and add:
- 🎫 Your **Discord Bot Token**
- 🗄️ Your **MySQL database credentials** (only if you enable DB persistence)
- 💬 The **Discord Channel ID** + message IDs for each embed

---

## ▶️ Running the Bot

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

The bot will:
1. Login to Discord
2. Fetch the latest occupancy data
3. Update the pinned messages in your chosen channel
4. Save a snapshot every 4 update cycles to your database (if DB is enabled)

---

## 🐳 Running with Docker

This project provides two Compose setups depending on whether you want persistence:

### Option A — Bot only (no database)
Use this if you **don’t** want to store data (Discord updates only).  
Compose file: `docker-compose.bot.yml`

```bash
docker compose -f docker-compose.bot.yml up -d --build
```
This sets `USE_DB=false` explicitly so the bot skips all DB writes.

### Option B — Bot + bundled MySQL (self-hosted)
Use this to run the bot **with its own MySQL** database.  
Compose file: `docker-compose.dev.yml`

```bash
docker compose -f docker-compose.dev.yml up -d --build
```
- MySQL is started alongside the bot.
- The schema is auto-created from `resources/sql/init.sql`.
- Data persists in the `db_data` volume.
- The bot connects internally to the `db` service with `USE_DB=true`.

---

## 🛠️ Configuration

### Environment Variables (`.env`)
```
# Discord
DISCORD_TOKEN=your-bot-token-here
TEXT_CHANNEL_ID=123456789012345678
MESSAGE_A3=123456789012345678
MESSAGE_A5=123456789012345678
MESSAGE_EHRENHOF=123456789012345678
MESSAGE_SCHNECKENHOF=123456789012345678

# Database
USE_DB=true                 # set false to disable DB writes entirely
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name

# Scraper
OCCUPANCY_URL=https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/
DEBUG=false
```

### Database Schema
The bot writes snapshots into a table `belegung`:

```sql
CREATE TABLE belegung (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bib VARCHAR(50) NOT NULL,
  percentage INT NOT NULL,
  occupied INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💡 Ideas for Extensions

- 📈 Grafana dashboard for historical occupancy data
- 🌐 REST API for other apps to consume the data

---

## ⚖️ Legal & Ethical Notes

- This project scrapes the **public seat availability page** of the University of Mannheim Library.
- According to the [robots.txt](https://www.bib.uni-mannheim.de/robots.txt), the relevant path `/standorte/freie-sitzplaetze/` is **not disallowed** for crawlers.
- The data is **publicly accessible** without authentication and intended to inform students about seat occupancy.
- Requests are made only **once every 150 seconds**, resulting in negligible server load.
- The bot is **non-commercial** and purely for student convenience (Discord notifications).
- I fully respect the rights of the University Library and will adapt or disable the scraper immediately if requested.

---

## 📜 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and share — just credit the author.

---

Made with ❤️
