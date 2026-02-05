# Database Connection Issue: Access Denied

The API is returning **503 Service Unavailable** errors because the backend server cannot connect to the Hostinger database.

**Error Details:**
```
Connection failed: Error: Access denied for user 'u860480593_rakhinelottery' (using password: YES)
Error Code: 1045
```

## How to Fix

This usually happens when your **IP Address** is not allowed to connect to the remote database. Hostinger blocks remote connections by default for security.

### Step 1: Log in to Hostinger
1. Open your Hostinger Dashboard.
2. Navigate to **Databases** > **Remote MySQL**.

### Step 2: Whitelist Your IP
1. You will see a section to add a new remote connection.
2. Select the database `u860480593_rakhinelottery`.
3. In the **IP (IPv4 or IPv6)** field, you can:
   - Check the box for **Any Host (%)** (Easiest for development, allows connections from anywhere).
   - OR click **"My IP"** to add only your current internet connection.
4. Click **Create**.

### Step 3: Restart Development Server
1. Go back to your terminal (PowerShell).
2. Stop the running server (Ctrl+C).
3. Run `npm run dev` again.
4. The errors should disappear.
