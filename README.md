# little moods ✿

A soft little website for noticing how you feel: check in with a mood, watch your mood garden grow, read back your feelings journal, and take a breath.

Your moods sync across your devices. You log in with your email (no password), then open your garden with a secret **mood key** of 4 emotions. Every mood is encrypted on your device with that key before it's uploaded, so the database only ever stores scrambled text.

## Files

| file | what it does |
|---|---|
| `index.html` | the website itself |
| `account.js` | logging in, the mood key, encryption and syncing |
| `config.js` | your Supabase project's address and public key |
| `supabase-setup.sql` | creates the database tables (run once) |

## Setting it up (about 10 minutes)

### 1. Make a Supabase project
1. Sign up for free at [supabase.com](https://supabase.com) and click **New project**.
2. Give it a name (like `little-moods`), choose a database password (save it somewhere, you won't need it for this site), and pick the region closest to you.
3. Wait a minute or two while it sets up.

### 2. Create the tables
1. In your project, open **SQL Editor** in the left sidebar.
2. Click **New query**, paste everything from `supabase-setup.sql`, and click **Run**.
3. You should see "Success. No rows returned."

### 3. Allow your site's address
1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to your GitHub Pages address, for example `https://YOUR-USERNAME.github.io/My-little-Moods/`
3. Under **Redirect URLs**, add the same address and save.

This is where login links are allowed to send you back to.

### 4. Paste your keys into `config.js`
1. Go to **Project Settings → API Keys**. (If you only see a **Create new API keys** button, click it.)
2. Copy the **Publishable key**. It starts with `sb_publishable_`.
3. Copy your **Project URL**. You can find it with the **Connect** button at the top of the project, and it looks like `https://abcdefgh.supabase.co`.
4. Put both into `config.js`:

```js
window.LITTLE_MOODS_CONFIG = {
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseKey: "sb_publishable_...",
};
```

The publishable key is meant to be public, so it's fine on GitHub. **Never** put a `secret` or `service_role` key in this file.

### 5. Upload and try it
1. Upload `index.html`, `account.js`, `config.js` (and this README) to your GitHub repo.
2. Wait for the newest **pages build and deployment** run to show a green ✓ in the **Actions** tab.
3. Open your site, type your email, and click the link in the email.
4. Choose your 4-emotion mood key, then tap it again to confirm.
5. On your phone: open the same site, use the same email, tap the link on your phone, and tap your mood key. Your garden is there ✿

## Good to know

- **Login emails:** Supabase's built-in email service only sends a few emails per hour, which is plenty for one person. If you share the site with lots of people, connect your own email provider under **Authentication → Emails → SMTP settings**.
- **Forgot your mood key?** It can't be recovered, because it's what locks your moods. The "forgot your key?" option deletes your garden so you can start fresh.
- **How private is it?** Nobody else can read your rows (row level security), and the moods themselves are encrypted. But a 4-emotion key only has 2,401 combinations, so the encryption alone wouldn't stop someone who got a copy of the database and really tried. Your email login is the main lock.
- **Lock & log out:** the 🔒 button locks your garden until you tap your key again (it also locks itself after 20 quiet minutes). **Log out** signs you out of your account on that device.
