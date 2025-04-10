# Security Audit Report: Strentor Application

## Executive Summary

This security audit identifies several vulnerabilities in the Strentor application codebase, focusing on authentication, API security, data handling, and configuration issues. The vulnerabilities are categorized by priority level, with detailed explanations and recommended fixes.

## Critical Vulnerabilities

### 1. Hardcoded API Keys and Secrets in `.env.local`
**Location**: `.env.local` (Lines 6-10)  
**Description**: Supabase API keys and Razorpay credentials are hardcoded in the repository.  
**Risk**: These credentials can be used to access the database, manipulate data, and potentially intercept payments.  
**Fix**: Remove secrets from the repository and use environment variables through a secure deployment pipeline.

```
# Before
NEXT_PUBLIC_SUPABASE_URL=https://zunoqjiwhyzimcayolyu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bm9xaml3aHl6aW1jYXlvbHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NDkwNzIsImV4cCI6MjA1NjMyNTA3Mn0.KXj7-C5MU2gp812KTjrzZW-1UNDcuyT8tf4oBCaRPx0

RAZORPAY_KEY_ID=rzp_test_kiKyv4iykNo6gt
RAZORPAY_KEY_SECRET=CJsK1b7Ot97HDgup8WdnIvau
RAZORPAY_WEBHOOK_SECRET="bghksty%\$365"

# After
# Use a secrets management service and load these variables from the environment
# Do not commit this file to the repository
```

### 2. Insufficient Validation in Razorpay Webhook Handler
**Location**: `app/api/webhooks/razorpay/route.ts` (Lines 28-125)  
**Description**: The webhook handler accepts and processes requests without strong authentication and could be vulnerable to webhook replay attacks.  
**Risk**: Attackers could forge payment confirmations or subscription activations.  
**Fix**: Implement webhook idempotency and additional verification checks.

## High Vulnerabilities

### 1. Delete Workout Logs Policy Too Permissive
**Location**: Database RLS Policy for `user_workout_logs`  
**Description**: The DELETE policy for `user_workout_logs` has a `qual` condition of `true`, allowing any authenticated user to delete any workout log.  
**Risk**: Users could delete other users' workout data.  
**Fix**: Update the RLS policy to restrict deletion to the user's own records.

```sql
-- Before
CREATE POLICY "Delete User Workout Logs" ON "public"."user_workout_logs"
FOR DELETE TO public
USING (true);

-- After
CREATE POLICY "Delete User Workout Logs" ON "public"."user_workout_logs"
FOR DELETE TO public
USING (auth.uid() = user_id);
```

### 2. Insecure Direct Object Reference in Subscription Access
**Location**: `app/api/subscriptions/create/route.ts` (Lines 6-131)  
**Description**: Subscription creation endpoint uses client-provided plan IDs without sufficient permission checks.  
**Risk**: Users could access or modify subscription plans they shouldn't have access to.  
**Fix**: Add additional validation and permission checks.

### 3. Overly Broad Data Access in Trainer Client Relationship
**Location**: Database RLS Policies  
**Description**: Multiple tables have overly permissive SELECT policies that don't have proper filtering.  
**Risk**: Users could access more data than intended, possibly viewing other clients' information.  
**Fix**: Tighten RLS policies to ensure proper data isolation.

## Medium Vulnerabilities

### 1. Missing Rate Limiting on Authentication Endpoints
**Location**: App-wide auth endpoints  
**Description**: No rate limiting is implemented on authentication endpoints.  
**Risk**: Vulnerability to brute force attacks and resource exhaustion.  
**Fix**: Implement rate limiting middleware for authentication endpoints.

### 2. Insecure File Type Validation in Photo Upload
**Location**: `app/(client)/photos/components/UploadPhotoSection.tsx` (Lines 120-131)  
**Description**: Client-side file type validation only checks if mime type starts with "image/" which can be spoofed.  
**Risk**: Users could upload malicious files.  
**Fix**: Implement server-side file validation and content-type checks.

```typescript
// Before
if (!file.type.startsWith("image/")) {
  setError("Please select an image file");
  return;
}

// After
// Client-side validation for better UX
if (!file.type.startsWith("image/")) {
  setError("Please select an image file");
  return;
}

// Then also implement server-side validation to check magic bytes
// and restrict to specific image formats (JPEG, PNG, etc.)
```

### 3. Lack of CSRF Protection in Forms
**Location**: Multiple form handlers  
**Description**: The application doesn't consistently implement CSRF tokens.  
**Risk**: Potential for cross-site request forgery attacks.  
**Fix**: Implement CSRF protection for all forms that modify data.

### 4. Missing Sanitization in User Input
**Location**: Various components accepting user input  
**Description**: Insufficient sanitization of user inputs before storage and display.  
**Risk**: Potential for XSS attacks or SQL injection.  
**Fix**: Implement proper input sanitization before storing and rendering user input.

## Low Vulnerabilities

### 1. Excessive Error Logging
**Location**: `app/api/webhooks/razorpay/route.ts` (Multiple lines)  
**Description**: Detailed error information is logged, potentially exposing sensitive information.  
**Risk**: Information disclosure in logs.  
**Fix**: Implement structured logging with proper error sanitization.

### 2. Debug Logs in Production Code
**Location**: Multiple files  
**Description**: Debug console logs are present in production code.  
**Risk**: Information leakage through browser console or server logs.  
**Fix**: Remove or disable debug logging in production.

### 3. Inconsistent Error Handling
**Location**: Multiple API handlers  
**Description**: Error handling is inconsistent across the application.  
**Risk**: Unpredictable application behavior and potential information disclosure.  
**Fix**: Implement a standardized error handling pattern across the application.

## Recommendations for System-wide Improvements

1. **Implement Proper Secrets Management**:
   - Move all secrets to a secure environment variable management system
   - Use different API keys for development and production

2. **Enhance Authentication Security**:
   - Add multi-factor authentication options
   - Implement proper session management with timeouts
   - Add login attempt rate limiting

3. **Improve API Security**:
   - Add rate limiting on all API endpoints
   - Implement consistent validation on all inputs
   - Use API versioning to manage changes safely

4. **Database Security**:
   - Review and tighten all RLS policies
   - Implement row-level encryption for sensitive data
   - Add audit logging for sensitive operations

5. **Code Quality Improvements**:
   - Implement static code analysis in the CI pipeline
   - Add security-focused code reviews to development process
   - Develop consistent error handling patterns

## Conclusion

This security audit has identified several vulnerabilities that should be addressed to improve the overall security posture of the Strentor application. Prioritize fixing the critical and high vulnerabilities immediately, followed by medium and low priority issues. Regular security reviews should be conducted as the application evolves. 