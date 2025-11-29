# Checklist: Render Cleanup

## Immediate Actions

### 1. Login ke Render
- URL: https://dashboard.render.com
- Check all services

### 2. Suspend ALL Services
- [ ] Web Service (backend)
- [ ] Static Site (frontend)
- [ ] Database (PostgreSQL/MySQL)
- [ ] Cron Jobs
- [ ] Background Workers

### 3. Delete Unnecessary Services (Optional)
Jika yakin tidak akan balik ke Render:
- Settings → Delete Service

### 4. Check External Webhooks
- [ ] Payment gateways
- [ ] Uptime monitors (UptimeRobot, etc.)
- [ ] Analytics
- [ ] Social media integrations

### 5. Check Domain DNS
```bash
# Check where domain points
nslookup pos-kedai99.zeabur.app
nslookup <your-custom-domain> # if any
```

### 6. Monitor Zeabur Logs
After 5-10 minutes, check if suspicious requests stop:
```
Zeabur Dashboard → backend → Logs
```

Look for patterns like:
- Repeated requests from same IP
- Health checks every X minutes
- Requests to /health or /api/health

## Expected Results

**Before cleanup:**
- Usage: ~$0.15-0.20/day
- Requests: 200-300/day
- Cold starts: Frequent

**After cleanup:**
- Usage: ~$0.05-0.08/day  
- Requests: 0-10/day (only your usage)
- Cold starts: Rare (only when you access)

## Billing Comparison

| Scenario | Daily Cost | Monthly Cost |
|----------|------------|--------------|
| Both Render + Zeabur active | $0.20-0.30 | $6-9 |
| Only Zeabur (optimized) | $0.05-0.08 | $1.5-2.5 |
| Savings | $0.15-0.22 | $4.5-6.5 |

## Notes
- Render services stay active until manually suspended
- Free tier limits reset monthly but services keep running
- Health checks continue even if app not used
