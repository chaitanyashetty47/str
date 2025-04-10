# Security Fixes Implementation Guide

This directory contains the scripts and instructions needed to fix the security vulnerabilities identified in the Strentor application. Follow these steps to implement the fixes in the correct order.

## 1. Environment Variables and Secrets

**Critical Priority**

1. Remove `.env.local` and other environment files containing secrets from the repository:
   ```bash
   git rm --cached .env.local
   git rm --cached .env
   ```

2. Create a new `.env.local.example` file with placeholders instead of actual values:
   ```
   # Update these with your Supabase details from your project settings > API
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

3. Update the `.gitignore` file using the provided template to ensure environment files are not accidentally committed.

4. Set up proper secrets management:
   - For local development: Each developer should create their own `.env.local` file
   - For production: Use the hosting platform's environment variable system (Vercel, Netlify, etc.)

## 2. Database Security Fixes

**High Priority**

1. Run the `fix-rls-policies.sql` script in your Supabase SQL Editor to fix the RLS policies:
   - Log into your Supabase dashboard
   - Go to SQL Editor
   - Copy the contents of `fix-rls-policies.sql` and execute it

2. Verify the changes by checking the RLS policies in the Auth section of your Supabase dashboard.

## 3. Code Changes

**Critical and High Priority**

1. Update `app/api/webhooks/razorpay/route.ts` with the improved webhook handler that implements:
   - Idempotency checks to prevent duplicate processing
   - Better error handling
   - Removal of sensitive logging

2. Update `app/api/subscriptions/create/route.ts` to fix the IDOR vulnerability by:
   - Adding permission checks
   - Limiting plan access based on status
   - Adding duplicate subscription checks

## 4. Additional Security Measures

**Medium Priority**

1. Implement rate limiting for authentication endpoints:
   - Add a middleware that tracks login attempts by IP and user
   - Implement exponential backoff for failed attempts

2. Improve file upload security:
   - Add server-side validation of file types
   - Implement file scanning for malicious content
   - Restrict upload sizes and file types

3. Add CSRF protection to forms:
   - Use Next.js built-in CSRF protection
   - Implement token-based protection for API routes

## 5. Testing Security Fixes

After implementing these fixes, verify that:

1. Webhook handlers correctly reject invalid signatures
2. Users can only access their own data
3. File uploads are properly validated
4. Authentication endpoints are protected against brute force
5. RLS policies are working as expected

## Important Notes

- Do not commit API keys or secrets to the repository
- Regularly rotate secrets and API keys
- Implement a security code review process for new features
- Set up security scanning as part of your CI/CD pipeline

For any questions about these fixes, please contact the security team. 