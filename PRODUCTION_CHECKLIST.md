# WPA Production Checklist

## Environment Variables
Set these in Vercel / your hosting provider:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET  (run: openssl rand -base64 32)
- NEXT_PUBLIC_APP_URL  (e.g. https://portal.whytepyramid.com)
- NODE_ENV=production

## Supabase
- [x] Run migration.sql in SQL Editor
- [ ] Enable Supabase database backups
- [ ] Set up daily backup schedule

## Security (already done)
- [x] bcrypt 12 rounds password hashing
- [x] JWT httpOnly cookies, 8h expiry
- [x] Rate limiting: 5 attempts / 15 min -> 30 min lockout
- [x] Timing attack prevention on login
- [x] Role-based middleware (pages + API routes)
- [x] Security headers: CSP, X-Frame-Options, X-Content-Type, etc.
- [x] poweredByHeader: false

## Deployment (Vercel)
1. Push code to GitHub
2. Import repo on vercel.com
3. Add all env vars
4. Deploy
5. Update NEXT_PUBLIC_APP_URL to production URL
6. Redeploy

## After Deploy
- [ ] Test all 4 roles end-to-end
- [ ] Delete test/demo learner accounts
- [ ] Change super admin default password
- [ ] Verify HTTPS is active
