---
description: How to deploy the InfoConnect application to Render.com
---

# Deploying InfoConnect to Render.com

This workflow guides you through deploying your full-stack application (Node.js + React) to Render.com as a Web Service.

## Prerequisites
- A GitHub account with the project repository uploaded.
- A [Render.com](https://render.com) account.
- A cloud database (e.g., Clever Cloud MySQL, PlanetScale, or Render PostgreSQL). *Note: Local XAMPP MySQL will not work on the cloud.*

## Steps

1. **Sign in to Render**
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Sign in with your GitHub account.

2. **Create a New Web Service**
   - Click "New +" and select "Web Service".
   - Select "Build and deploy from a Git repository".
   - Connect your `InfoConnect` repository.

3. **Configure the Service**
   - **Name:** `infoconnect-app` (or any unique name)
   - **Region:** Frankfurt (EU Central) - or closest to you.
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.cjs`

4. **Add Environment Variables**
   - Scroll down to "Environment Variables" and add:
     - `DB_HOST`: (Your Cloud Database Host)
     - `DB_USER`: (Your Cloud Database User)
     - `DB_PASSWORD`: (Your Cloud Database Password)
     - `DB_NAME`: (Your Cloud Database Name)
     - `DB_PORT`: (Usually 3306 for MySQL)
     - `SMTP_HOST`: `smtp.gmail.com`
     - `SMTP_USER`: (Your Gmail Address)
     - `SMTP_PASS`: (Your App Password)
     - `NODE_ENV`: `production`

5. **Deploy**
   - Click "Create Web Service".
   - Render will clone your repo, install dependencies, build the React frontend, and start the Node server.

## Troubleshooting
- **Database Connection Error:** Ensure your cloud database allows connections from everywhere (0.0.0.0/0) or specifically from Render's IP addresses.
- **Micro-services vs Monolith:** We configured this project as a monolith (single service) by serving the frontend via the backend in `server.cjs`.

