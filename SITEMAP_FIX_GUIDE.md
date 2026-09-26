# Sitemap Error Fix Guide

## Problem
Google Search Console is showing the error:
- **Error**: "Le sitemap peut être lu, mais contient des erreurs - URL non autorisée"
- **Translation**: "The sitemap can be read, but contains errors - URL not authorized"
- **Affected**: 2183 instances (all mosque URLs)

## Root Cause
This error typically occurs when:
1. The sitemap location in Google Search Console doesn't match where it's actually hosted
2. There's a protocol mismatch (HTTP vs HTTPS)
3. The sitemap is submitted at a subdirectory level but references URLs outside that directory

## Solution Steps

### Step 1: Verify Your Google Search Console Property
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Check which property you're using:
   - ✅ **Correct**: `https://mosquenearme.com` (with HTTPS, without www)
   - ❌ **Wrong**: `http://mosquenearme.com` (HTTP instead of HTTPS)
   - ❌ **Wrong**: `https://www.mosquenearme.com` (with www subdomain)
   - ❌ **Wrong**: Domain property without specific protocol

### Step 2: Remove Old Sitemap (if exists)
1. In Google Search Console, go to **Sitemaps** section
2. If there's an old sitemap listed, remove it
3. This is especially important if it was submitted as:
   - `/sitemap.xml` (relative path)
   - A different domain/protocol
   - A subdirectory path

### Step 3: Submit the Correct Sitemap
1. In the **Sitemaps** section, add a new sitemap
2. Enter the **FULL URL**: `https://mosquenearme.com/sitemap.xml`
3. **Do NOT use**: 
   - `/sitemap.xml` (relative)
   - `sitemap.xml` (without leading slash)
   - Any subdirectory path

### Step 4: Verify Sitemap Access
Before submitting to Google, verify your sitemap is accessible:
1. Open a browser and visit: `https://mosquenearme.com/sitemap.xml`
2. You should see the sitemap index with 3 child sitemaps
3. Click on each child sitemap URL to verify they load:
   - `https://mosquenearme.com/sitemap-pages.xml`
   - `https://mosquenearme.com/sitemap-mosques.xml`
   - `https://mosquenearme.com/sitemap-cities.xml`

### Step 5: Verify robots.txt
1. Visit `https://mosquenearme.com/robots.txt`
2. Ensure it contains: `Sitemap: https://mosquenearme.com/sitemap.xml`
3. **Important**: The URL in robots.txt must match exactly what's in Google Search Console

## Updated Sitemap Structure

The sitemaps have been regenerated with the following structure:

### sitemap.xml (Index)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://mosquenearme.com/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://mosquenearme.com/sitemap-mosques.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://mosquenearme.com/sitemap-cities.xml</loc>
  </sitemap>
</sitemapindex>
```

### sitemap-pages.xml (Main Pages)
- Homepage: `https://mosquenearme.com/`
- Search: `https://mosquenearme.com/search`
- Near Me: `https://mosquenearme.com/near-me`

### sitemap-mosques.xml (2183 Mosque Pages)
- All mosque pages: `https://mosquenearme.com/mosques/{slug}`

### sitemap-cities.xml (City Pages)
- All city pages: `https://mosquenearme.com/cities/{slug}`

## Common Mistakes to Avoid

❌ **Submitting sitemap with relative path**: `/sitemap.xml`
✅ **Use full URL**: `https://mosquenearme.com/sitemap.xml`

❌ **Mixed protocols**: Sitemap uses HTTPS but submitted as HTTP
✅ **Match protocol**: Both sitemap URLs and submission use HTTPS

❌ **Wrong property**: Submitting to www subdomain when site is on root domain
✅ **Correct property**: Submit to the exact domain where your site is hosted

❌ **Sitemap location doesn't have authority**: Sitemap in `/en/` trying to reference `/mosques/`
✅ **Root location**: Sitemap at `/sitemap.xml` can reference all site URLs

## Deployment Checklist

When deploying to production:
- [ ] Build static files: `npm run build`
- [ ] Generate sitemaps: `npx tsx scripts/generate-static-assets.ts`
- [ ] Upload all sitemap files from `public/` directory:
  - [ ] sitemap.xml
  - [ ] sitemap-pages.xml
  - [ ] sitemap-mosques.xml
  - [ ] sitemap-cities.xml
- [ ] Upload `robots.txt` with correct sitemap URL
- [ ] Verify all sitemaps are accessible at `https://mosquenearme.com/`
- [ ] Submit sitemap to Google Search Console with full URL

## After Submission

1. **Wait 24-48 hours** for Google to process the sitemap
2. Check the **Coverage** report in Google Search Console
3. The error should disappear if:
   - The sitemap is at the root level
   - All URLs use the same protocol (HTTPS)
   - The property in GSC matches your actual domain

## Still Having Issues?

If the error persists after following all steps:

1. **Check for redirects**: Ensure `https://mosquenearme.com/sitemap.xml` doesn't redirect to another URL
2. **Verify hosting**: Some shared hosting providers require sitemaps to be placed in a specific location
3. **Check .htaccess**: If using Apache, ensure there are no rewrite rules affecting sitemap access
4. **Protocol consistency**: Ensure ALL URLs in your sitemaps use `https://` (not `http://`)
5. **Resubmit**: Sometimes Google needs a fresh submission after fixing the root cause

## Additional Resources

- [Google Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Console Help](https://support.google.com/webmasters/answer/183668)
- [Sitemap Authorization Issues](https://support.google.com/webmasters/answer/10835176)
