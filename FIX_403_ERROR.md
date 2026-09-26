# Fix 403 Forbidden Error - Hostinger Deployment

## Problem
- ❌ Getting 403 Forbidden error after upload
- ❌ ZIP file is only 1 MB (should be much larger)
- ❌ Files not extracted properly

## Why This Happened
The `out` folder is **349 MB** - too large for Hostinger's web upload in one go. The compression got stuck and created an incomplete file.

## Solution: Use FTP Upload Instead

### Option 1: FileZilla (RECOMMENDED - Easiest)

#### Step 1: Download FileZilla
1. Go to https://filezilla-project.org/download.php?type=client
2. Download and install FileZilla Client

#### Step 2: Get Your FTP Credentials from Hostinger
1. Log in to Hostinger control panel
2. Go to **Files** → **FTP Accounts**
3. Note down:
   - **FTP Host:** (usually `ftp.mosquenearme.com` or similar)
   - **Username:** (usually your domain or account name)
   - **Password:** (create new password if needed)
   - **Port:** 21 (or 22 for SFTP)

#### Step 3: Connect with FileZilla
1. Open FileZilla
2. Enter at the top:
   - **Host:** Your FTP host
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** 21
3. Click **Quickconnect**

#### Step 4: Upload Files
1. In FileZilla:
   - **Left pane:** Navigate to `C:\Users\HP\Desktop\mosque\out\`
   - **Right pane:** Navigate to `/public_html/`

2. **IMPORTANT - Clear public_html first:**
   - In right pane (server), select all files/folders in `public_html`
   - Right-click → Delete
   - Confirm deletion

3. **Upload all files:**
   - In left pane, select ALL files and folders inside the `out` directory
   - Right-click → Upload
   - Wait for upload to complete (may take 10-15 minutes for 349 MB)

#### Step 5: Set Permissions
1. In FileZilla right pane (`public_html` on server):
   - Right-click on `index.html`
   - File permissions → Set to **644**
2. For all folders (cities, mosques, etc.):
   - Right-click on folder
   - File permissions → Set to **755** (with recursive)

---

### Option 2: Hostinger File Manager (Split Upload)

If you can't use FTP, split the upload:

#### Step 1: Upload Essential Files First

Create a minimal deployment with just the main pages:

1. From your `out` folder, manually copy these to a new folder `deploy-minimal`:
   ```
   index.html
   search.html
   near-me.html
   about.html
   contact.html
   404.html
   robots.txt
   sitemap.xml
   sitemap-pages.xml
   sitemap-mosques.xml
   sitemap-cities.xml
   _next/ (entire folder)
   ```

2. Zip this `deploy-minimal` folder
3. Upload to Hostinger File Manager
4. Extract in `public_html`
5. **Test:** Visit `https://mosquenearme.com/` - should work now!

#### Step 2: Upload Cities (Split into batches)

The cities folder is large, so split it:

**Batch 1: Cities A-M**
```powershell
New-Item -ItemType Directory -Path "deploy-cities-am"
Copy-Item "out/cities/a*.html" "deploy-cities-am/"
Copy-Item "out/cities/b*.html" "deploy-cities-am/"
Copy-Item "out/cities/c*.html" "deploy-cities-am/"
Copy-Item "out/cities/d*.html" "deploy-cities-am/"
Copy-Item "out/cities/e*.html" "deploy-cities-am/"
Copy-Item "out/cities/f*.html" "deploy-cities-am/"
Copy-Item "out/cities/g*.html" "deploy-cities-am/"
Copy-Item "out/cities/h*.html" "deploy-cities-am/"
Copy-Item "out/cities/i*.html" "deploy-cities-am/"
Copy-Item "out/cities/j*.html" "deploy-cities-am/"
Copy-Item "out/cities/k*.html" "deploy-cities-am/"
Copy-Item "out/cities/l*.html" "deploy-cities-am/"
Copy-Item "out/cities/m*.html" "deploy-cities-am/"
Compress-Archive -Path "deploy-cities-am/*" -DestinationPath "cities-am.zip" -Force
```

**Batch 2: Cities N-Z**
```powershell
New-Item -ItemType Directory -Path "deploy-cities-nz"
Copy-Item "out/cities/n*.html" "deploy-cities-nz/"
Copy-Item "out/cities/o*.html" "deploy-cities-nz/"
Copy-Item "out/cities/p*.html" "deploy-cities-nz/"
Copy-Item "out/cities/q*.html" "deploy-cities-nz/"
Copy-Item "out/cities/r*.html" "deploy-cities-nz/"
Copy-Item "out/cities/s*.html" "deploy-cities-nz/"
Copy-Item "out/cities/t*.html" "deploy-cities-nz/"
Copy-Item "out/cities/u*.html" "deploy-cities-nz/"
Copy-Item "out/cities/v*.html" "deploy-cities-nz/"
Copy-Item "out/cities/w*.html" "deploy-cities-nz/"
Copy-Item "out/cities/x*.html" "deploy-cities-nz/"
Copy-Item "out/cities/y*.html" "deploy-cities-nz/"
Copy-Item "out/cities/z*.html" "deploy-cities-nz/"
Compress-Archive -Path "deploy-cities-nz/*" -DestinationPath "cities-nz.zip" -Force
```

Upload each ZIP to `public_html/cities/` and extract.

#### Step 3: Upload Mosques (Split into batches)

Similar process for mosques - split alphabetically into 4-5 ZIP files.

---

### Option 3: Use Existing out.zip (If Available)

I see you already have `out.zip` (80 MB) in your project folder. Try uploading that instead:

1. Upload `out.zip` to Hostinger File Manager
2. Extract in `/public_html/`
3. Move all files FROM `out/` subfolder TO root of `public_html/`

---

## After Upload - Fix Permissions

### Via File Manager:
1. Select all files in `public_html`
2. Right-click → Change Permissions
3. Set:
   - **Files:** 644
   - **Folders:** 755

### Create .htaccess File

In `public_html/`, create a new file called `.htaccess` with this content:

```apache
# Enable clean URLs
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Remove .html extension
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+)$ $1.html [L,QSA]

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST%}/$1 [L,R=301]

# Custom error pages
ErrorDocument 404 /404.html
ErrorDocument 403 /404.html
</IfModule>

# Prevent directory listing
Options -Indexes

# Set default page
DirectoryIndex index.html
```

## Test After Deployment

1. `https://mosquenearme.com/` ← Should show homepage
2. `https://mosquenearme.com/cities/aberdeen-city` ← Should show city page
3. `https://mosquenearme.com/sitemap.xml` ← Should show sitemap

## If Still Getting 403

### Check These:

1. **index.html exists in public_html:** 
   - Must be directly in `public_html/index.html`
   - NOT in `public_html/out/index.html`

2. **File permissions:**
   - index.html = 644
   - public_html folder = 755

3. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear everything
   - Try again in incognito/private mode

4. **Hostinger cache:**
   - In Hostinger panel, find "Website" → "Clear cache"

## Recommendation

**Use FileZilla (Option 1)** - it's the easiest and most reliable way to upload 349 MB of files. The web-based file manager struggles with large uploads.

## Need Help?

If FileZilla doesn't work, let me know and I can help you with the split upload method!
