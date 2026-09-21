# Deploying uniflexstore.com + uniflexogistics.com to one VPS

Two separate Next.js apps, two domains, one Ubuntu VPS. Both apps share the same Neon
Postgres database (already set up — nothing to do there). Written for **Ubuntu 22.04/24.04**;
if Namecheap gave you a different OS, the package manager commands (`apt`) will differ but
everything else is the same.

Run every command below over SSH, in order. Replace the placeholders as you go:

| Placeholder | Replace with |
|---|---|
| `YOUR_VPS_IP` | The IP address Namecheap gave you for the VPS |
| `deploy` | Whatever non-root username you create in Step 1 |
| `uniflexstore.com` | Your store domain (as registered on Namecheap) |
| `uniflexogistics.com` | Your logistics domain (as registered on Namecheap) |
| `you@example.com` | Your real email, for Let's Encrypt renewal notices |

---

## 0. Before you start

- Have your VPS root password/SSH key from Namecheap ready.
- Have both domains' DNS management open in another tab (Namecheap → Domain List → Manage → Advanced DNS).
- Have the two GitHub repo URLs ready:
  - `https://github.com/<you>/uniflexstore.com`
  - `https://github.com/MOsaidJutt/uniflexogistics.com`
- Have your `.env` secrets ready (DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, CLOUDINARY_*, STRIPE_*, etc.) — copy them from your local `.env.local` files. **Never commit these to git; they get created by hand directly on the server in Step 5.**

---

## 1. First login and basic server setup

```bash
ssh root@YOUR_VPS_IP
```

Update the system and create a non-root user (running everything as root long-term is a bad habit):

```bash
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy
```

Copy your SSH key to the new user so you don't need a password every time:

```bash
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

From now on, log in as `deploy`, not `root`:

```bash
exit
ssh deploy@YOUR_VPS_IP
```

Set up a basic firewall — only SSH, HTTP, HTTPS allowed in:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 2. Install Node.js, PM2, Nginx, Certbot, git

```bash
# Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# PM2 — keeps both Next.js apps running, restarts them on crash/reboot
sudo npm install -g pm2

# Certbot for free SSL certificates
sudo apt install -y certbot python3-certbot-nginx
```

Verify:

```bash
node -v    # should print v22.x
npm -v
nginx -v
```

---

## 3. Point both domains at the VPS (Namecheap DNS)

In Namecheap → Domain List → each domain → **Manage → Advanced DNS**, delete any existing
`A`/`CNAME` records for `@` and `www`, and add:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `YOUR_VPS_IP` | Automatic |
| A Record | `www` | `YOUR_VPS_IP` | Automatic |

Do this for **both** `uniflexstore.com` and `uniflexogistics.com`. DNS propagation usually
takes a few minutes to a few hours — you can move on to the next steps while it settles, but
Certbot (Step 6) won't work until it's live. Check with:

```bash
dig +short uniflexstore.com
dig +short uniflexogistics.com
```

Once these print `YOUR_VPS_IP`, you're good to continue.

---

## 4. Clone both repos onto the server

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www

git clone https://github.com/<you>/uniflexstore.com.git
git clone https://github.com/MOsaidJutt/uniflexogistics.com.git
```

(If either repo is private, GitHub will prompt for credentials — use a
[personal access token](https://github.com/settings/tokens) as the password, or set up a
deploy key. A PAT is faster to set up for a first deploy.)

---

## 5. Configure environment variables on the server

Neither `.env.local` file exists on the server yet (git ignores them on purpose). Create them
by hand:

```bash
nano /var/www/uniflexstore.com/.env.local
```

Paste in the same values from your local `.env.local`, but update:

```
NEXT_PUBLIC_APP_URL=https://uniflexstore.com
```

Save (`Ctrl+O`, Enter, `Ctrl+X`), then do the same for the logistics app:

```bash
nano /var/www/uniflexogistics.com/.env.local
```

Same idea — paste your local values, but set:

```
NEXT_PUBLIC_APP_URL=https://uniflexogistics.com
```

**Important:** `DATABASE_URL` / `DATABASE_DIRECT_URL` should be **identical** in both files —
both apps point at the same Neon database. `AUTH_SECRET` should be **different** in each
(they already are, if you're using the values from each project's local `.env.local`).

---

## 6. Install, build, and get SSL certs — uniflexstore.com

```bash
cd /var/www/uniflexstore.com
npm install
npm run build
```

Set up the initial Nginx site so Certbot has something to attach the cert to:

```bash
sudo nano /etc/nginx/sites-available/uniflexstore.com
```

```nginx
server {
    listen 80;
    server_name uniflexstore.com www.uniflexstore.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/uniflexstore.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Now get the certificate (Certbot edits the Nginx config in place to add HTTPS):

```bash
sudo certbot --nginx -d uniflexstore.com -d www.uniflexstore.com --email you@example.com --agree-tos --redirect
```

Start the app with PM2 on port 3000:

```bash
cd /var/www/uniflexstore.com
pm2 start npm --name "uniflexstore" -- start -- -p 3000
```

---

## 7. Install, build, and get SSL certs — uniflexogistics.com

Same process, different port (3001) and domain:

```bash
cd /var/www/uniflexogistics.com
npm install
npm run build
```

```bash
sudo nano /etc/nginx/sites-available/uniflexogistics.com
```

```nginx
server {
    listen 80;
    server_name uniflexogistics.com www.uniflexogistics.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/uniflexogistics.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d uniflexogistics.com -d www.uniflexogistics.com --email you@example.com --agree-tos --redirect
```

```bash
cd /var/www/uniflexogistics.com
pm2 start npm --name "uniflexogistics" -- start -- -p 3001
```

---

## 8. Make both apps survive a server reboot

```bash
pm2 save
pm2 startup
```

`pm2 startup` prints a command starting with `sudo env PATH=...` — copy that exact line it
gives you and run it. This registers PM2 as a systemd service so both apps come back up
automatically if the VPS restarts.

Check both are running:

```bash
pm2 status
```

You should see `uniflexstore` and `uniflexogistics` both `online`.

---

## 9. Verify

Open both in a browser:

- `https://uniflexstore.com` — store, should load with a padlock (SSL working)
- `https://uniflexogistics.com` — logistics landing page
- `https://uniflexogistics.com/crm/login` — CRM staff login

If a page doesn't load, check the app's logs:

```bash
pm2 logs uniflexstore
pm2 logs uniflexogistics
```

And Nginx's error log if it's a 502/504:

```bash
sudo tail -50 /var/log/nginx/error.log
```

---

## 10. Deploying updates later (both sites)

Whenever you push new commits to either repo, deploy them like this:

```bash
# Store
cd /var/www/uniflexstore.com
git pull
npm install
npm run build
pm2 restart uniflexstore

# Logistics/CRM
cd /var/www/uniflexogistics.com
git pull
npm install
npm run build
pm2 restart uniflexogistics
```

`pm2 restart` is near-instant (a few seconds of downtime max). If you want zero-downtime
deploys or want this to happen automatically on every push (via GitHub Actions), that's a
reasonable next upgrade once things are stable — ask and I'll set it up.

---

## Notes specific to this setup

- **Shared database, separate apps.** Both projects point at the same Neon Postgres
  instance. Schema changes (new columns/tables) should only ever be made from the
  `uniflexstore.com` project (`npx prisma db push` there) — never run `db push` or
  `migrate` from `uniflexogistics.com`, since its `prisma/schema.prisma` only declares a
  subset of the tables and Prisma would try to drop everything it doesn't see declared.
  This is called out in a comment at the top of `uniflexogistics.com/prisma/schema.prisma`.
- **CRM staff seeding.** After the first deploy of `uniflexogistics.com`, if `CrmStaff` rows
  don't already exist in the database (they should, since it's the same DB the old
  `uniflexstore.com/crm` was using), run:
  ```bash
  cd /var/www/uniflexogistics.com
  npm run db:seed-staff
  ```
- **Cloudinary and Resend accounts are shared** between both apps — same API keys in both
  `.env.local` files, no extra accounts needed.
- **SSL auto-renewal** is handled automatically by a systemd timer Certbot installs — nothing
  to do. Verify it's active with `sudo systemctl status certbot.timer`.
