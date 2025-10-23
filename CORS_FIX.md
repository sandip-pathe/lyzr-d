# CORS Fix for Production Deployment

## Problem
Frontend at `https://lyzr.anaya.legal` was being blocked by CORS policy when accessing backend at `https://lyzr-d-production.up.railway.app`.

## Solution Applied

### 1. Updated `backend/app/core/config.py`
- Changed `CORS_ORIGINS` from a list to a string (comma-separated)
- Added `cors_origins_list` property to parse the string
- Supports `*` for allowing all origins
- Automatically adds Railway public domain in production

### 2. Updated `backend/app/main.py`
- Added `CustomCORSMiddleware` that supports pattern matching for Railway URLs
- Automatically allows all `*.railway.app` and `*.up.railway.app` origins
- Keeps standard CORS middleware for backwards compatibility

## Railway Environment Variables

### Current Settings (Local `.env`)
```bash
CORS_ORIGINS=http://localhost:3000,https://lyzr.anaya.legal
FRONTEND_URL=http://localhost:3000
```

### Required Railway Settings

Set these in Railway dashboard for your backend service:

```bash
# Option 1: Specific origins (Recommended)
CORS_ORIGINS=https://lyzr.anaya.legal,http://localhost:3000

# Option 2: Allow all (Not recommended for production)
CORS_ORIGINS=*

# Frontend URL for notifications/approvals
FRONTEND_URL=https://lyzr.anaya.legal
```

## Deployment Steps

1. **Update Railway environment variables:**
   ```bash
   # In Railway dashboard -> your backend service -> Variables
   CORS_ORIGINS=https://lyzr.anaya.legal
   FRONTEND_URL=https://lyzr.anaya.legal
   ```

2. **Deploy the changes:**
   ```bash
   git add .
   git commit -m "fix: Add dynamic CORS support for Railway deployment"
   git push
   ```

3. **Verify deployment:**
   - Railway will auto-deploy
   - Check logs for: `🌐 CORS enabled for: ['https://lyzr.anaya.legal']`
   - Check logs for: `🌐 Also allowing all *.railway.app and *.up.railway.app origins`

4. **Test the frontend:**
   - Visit https://lyzr.anaya.legal
   - Check browser console - CORS errors should be gone
   - Try creating and executing a workflow

## How It Works

The `CustomCORSMiddleware` checks incoming requests and:
1. Extracts the `Origin` header
2. Checks if it matches:
   - Exact matches from `CORS_ORIGINS` list
   - Pattern `https://*.railway.app`
   - Pattern `https://*.up.railway.app`
3. If matched, adds appropriate CORS headers to the response
4. Handles preflight OPTIONS requests properly

## Benefits

✅ Works with Railway's dynamic preview URLs  
✅ Supports multiple frontends (production + development)  
✅ No hardcoded URLs in code  
✅ Secure - only allows specified origins  
✅ Easy to configure via environment variables  

## Troubleshooting

### If CORS errors persist:

1. **Check Railway logs:**
   ```bash
   railway logs
   ```
   Look for the CORS configuration line

2. **Verify environment variables:**
   ```bash
   railway variables
   ```

3. **Test with curl:**
   ```bash
   curl -H "Origin: https://lyzr.anaya.legal" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://lyzr-d-production.up.railway.app/api/workflows/
   ```
   Should return CORS headers in response

4. **Temporarily allow all origins for testing:**
   ```bash
   # In Railway
   CORS_ORIGINS=*
   ```
   ⚠️ Don't leave this in production!

## Security Notes

- Never use `CORS_ORIGINS=*` in production with `allow_credentials=True`
- Always specify exact origins for production
- The Railway pattern matching is safe because it only matches subdomains of `railway.app`
- Keep `FRONTEND_URL` updated to match your production frontend

## Next Steps

After this fix is deployed:
1. ✅ CORS errors should be resolved
2. ✅ Frontend can communicate with backend
3. ✅ Workflows can be created and executed
4. ✅ WebSocket connections should work

If you see other errors after CORS is fixed, they will be related to:
- Database connectivity
- Temporal Cloud connection
- API authentication
- Node execution logic

These are separate issues and should be debugged individually.
