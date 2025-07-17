# Inviting Trainers & Admins in Supabase

## Overview

This guide covers different methods to invite trainers and admins to your fitness platform using Supabase authentication. Since your RBAC system assigns roles (CLIENT, TRAINER, ADMIN), you need proper invitation flows to create users with the correct roles.

## 🎯 **Available Invitation Methods**

1. **🔧 Admin Dashboard Method** - Manual invites via Supabase dashboard
2. **💻 Server Action Method** - Programmatic invites via your app
3. **🖥️ Admin Panel Method** - Custom admin interface in your app
4. **📧 Email Invitation Method** - Custom invitation flow with role assignment

---

## Method 1: Admin Dashboard (Quick & Simple)

### Step 1.1: Access Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Users**
3. Click **"Invite User"** button

### Step 1.2: Send Invitation

```
Email: trainer@example.com
Role: authenticated (default)
```

### Step 1.3: Handle Role Assignment

**⚠️ Problem**: Dashboard invites create users with CLIENT role by default.

**✅ Solution**: Update role after user signs up using this SQL:

```sql
-- Update user role after they complete signup
UPDATE public."User" 
SET role = 'TRAINER' 
WHERE email = 'trainer@example.com';

-- For admin users
UPDATE public."User" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

### Step 1.4: Custom Email Template (Optional)

Configure custom invitation email in **Authentication → Email Templates → Invite user**:

```html
<h2>Welcome to Strentor Fitness!</h2>
<p>You've been invited to join as a {{ .Role }} member.</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invitation</a></p>
```

---

## Method 2: Server Action (Recommended)

### Step 2.1: Create Invitation Server Action

```typescript
// actions/admin/invite-user.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { requireRole } from '@/lib/server-auth';
import { encodedRedirect } from '@/utils/utils';

export async function inviteUserAction(formData: FormData) {
  // Only admins can invite users
  await requireRole(['ADMIN']);
  
  const email = formData.get('email')?.toString();
  const role = formData.get('role')?.toString() as 'TRAINER' | 'ADMIN';
  const name = formData.get('name')?.toString();
  
  if (!email || !role || !name) {
    return encodedRedirect('error', '/admin/users', 'All fields are required');
  }
  
  if (!['TRAINER', 'ADMIN'].includes(role)) {
    return encodedRedirect('error', '/admin/users', 'Invalid role specified');
  }
  
  const supabase = await createClient();
  
  try {
    // Step 1: Invite user via Supabase Auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        invited_role: role, // Store intended role in metadata
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invited_role=${role}`,
    });
    
    if (error) {
      return encodedRedirect('error', '/admin/users', error.message);
    }
    
    // Step 2: Pre-create user record with correct role
    if (data.user) {
      const { error: userError } = await supabase
        .from('User')
        .insert({
          authUserId: data.user.id,
          email: data.user.email!,
          name,
          role,
          profileCompleted: false,
          createdAt: new Date(),
        });
      
      if (userError) {
        console.error('Error creating user record:', userError);
        // Note: User auth record exists, but User table record failed
        // Consider cleanup or manual intervention
      }
    }
    
    return encodedRedirect(
      'success', 
      '/admin/users', 
      `${role} invitation sent to ${email}`
    );
    
  } catch (error) {
    console.error('Invitation error:', error);
    return encodedRedirect('error', '/admin/users', 'Failed to send invitation');
  }
}
```

### Step 2.2: Create Admin UI for Invitations

```typescript
// app/admin/users/invite-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inviteUserAction } from '@/actions/admin/invite-user';

export function InviteUserForm() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    await inviteUserAction(formData);
    setIsLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="trainer@example.com"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <Select name="role" required>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRAINER">Trainer</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
      </Button>
    </form>
  );
}
```

### Step 2.3: Admin Users Page

```typescript
// app/admin/users/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InviteUserForm } from './invite-form';
import { UsersList } from './users-list';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">User Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Invite New User</h2>
            <InviteUserForm />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Existing Users</h2>
            <UsersList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## Method 3: Enhanced Auth Callback

### Step 3.1: Update Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const invited_role = searchParams.get('invited_role');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user && invited_role) {
      // Handle invited user role assignment
      const { error: userError } = await supabase
        .from('User')
        .upsert({
          authUserId: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || 'New User',
          role: invited_role as 'TRAINER' | 'ADMIN',
          profileCompleted: false,
        }, {
          onConflict: 'authUserId'
        });
      
      if (userError) {
        console.error('Error updating user role:', userError);
      }
      
      // Redirect to role-specific onboarding
      const redirectUrl = invited_role === 'TRAINER' 
        ? '/onboarding/trainer' 
        : '/onboarding/admin';
      
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

### Step 3.2: Role-Specific Onboarding Pages

```typescript
// app/onboarding/trainer/page.tsx
export default function TrainerOnboardingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, Trainer!</h1>
      <p className="mb-6">Complete your trainer profile setup.</p>
      
      {/* Trainer-specific onboarding form */}
      <TrainerOnboardingForm />
    </div>
  );
}

// app/onboarding/admin/page.tsx
export default function AdminOnboardingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, Admin!</h1>
      <p className="mb-6">Complete your admin profile setup.</p>
      
      {/* Admin-specific onboarding form */}
      <AdminOnboardingForm />
    </div>
  );
}
```

---

## Method 4: Bulk Invitation System

### Step 4.1: CSV Upload for Bulk Invites

```typescript
// actions/admin/bulk-invite.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { requireRole } from '@/lib/server-auth';
import { parse } from 'csv-parse/sync';

export async function bulkInviteUsersAction(formData: FormData) {
  await requireRole(['ADMIN']);
  
  const file = formData.get('csvFile') as File;
  if (!file) throw new Error('No file provided');
  
  const csvContent = await file.text();
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });
  
  const supabase = await createClient();
  const results = [];
  
  for (const record of records) {
    const { email, name, role } = record;
    
    try {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name, invited_role: role },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invited_role=${role}`,
      });
      
      if (!error && data.user) {
        await supabase.from('User').insert({
          authUserId: data.user.id,
          email,
          name,
          role,
          profileCompleted: false,
        });
        
        results.push({ email, status: 'success' });
      } else {
        results.push({ email, status: 'error', error: error?.message });
      }
    } catch (err) {
      results.push({ email, status: 'error', error: String(err) });
    }
  }
  
  return results;
}
```

### Step 4.2: CSV Upload Component

```typescript
// components/admin/bulk-invite-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bulkInviteUsersAction } from '@/actions/admin/bulk-invite';

export function BulkInviteForm() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const uploadResults = await bulkInviteUsersAction(formData);
      setResults(uploadResults);
    } catch (error) {
      console.error('Bulk invite error:', error);
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Bulk Invite Users</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV file with columns: email, name, role
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <Input
          name="csvFile"
          type="file"
          accept=".csv"
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Upload & Send Invitations'}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Results:</h4>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.email}: {result.status}
                {result.error && ` - ${result.error}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Method 5: Custom Email Templates

### Step 5.1: Configure Supabase Email Templates

1. Go to **Authentication → Email Templates**
2. Select **"Invite user"** template
3. Update with custom content:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation to Strentor Fitness</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Strentor Fitness</h1>
  </div>
  
  <div style="padding: 20px;">
    <h2>You've Been Invited!</h2>
    
    <p>Hello,</p>
    
    <p>You've been invited to join <strong>Strentor Fitness</strong> as a <strong>{{ .UserMetaData.invited_role }}</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    
    <p>This invitation will expire in 24 hours.</p>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
```

### Step 5.2: Custom Email Variables

You can use these variables in email templates:

- `{{ .Email }}` - Invited user's email
- `{{ .ConfirmationURL }}` - Invitation acceptance URL
- `{{ .UserMetaData.invited_role }}` - Role from invitation
- `{{ .UserMetaData.full_name }}` - Name from invitation
- `{{ .SiteURL }}` - Your app's URL

---

## Security Considerations

### 🔒 **Important Security Rules**

1. **Role Validation**: Always validate roles on server-side
2. **Admin Only**: Only ADMIN users should invite TRAINER/ADMIN roles
3. **Email Verification**: Ensure invited users verify their email
4. **Audit Trail**: Log all invitation activities
5. **Rate Limiting**: Prevent invitation spam

### 🛡️ **Implementation Example**

```typescript
// lib/invitation-security.ts
export async function validateInvitation(
  inviterRole: string, 
  targetRole: string
): Promise<boolean> {
  // Only ADMIN can invite TRAINER or ADMIN
  if (['TRAINER', 'ADMIN'].includes(targetRole)) {
    return inviterRole === 'ADMIN';
  }
  
  // Anyone can invite CLIENT (if needed)
  return targetRole === 'CLIENT';
}

export async function logInvitation(
  inviterId: string,
  targetEmail: string,
  targetRole: string,
  success: boolean
) {
  const supabase = await createClient();
  
  await supabase.from('InvitationLog').insert({
    inviterId,
    targetEmail,
    targetRole,
    success,
    timestamp: new Date(),
  });
}
```

---

## Testing Your Invitation Flow

### 🧪 **Test Checklist**

- [ ] Admin can invite trainers via dashboard
- [ ] Admin can invite trainers via app interface
- [ ] Invited trainers receive email with correct role
- [ ] Auth callback assigns correct role
- [ ] JWT tokens include correct role after signup
- [ ] Role-specific onboarding works
- [ ] Non-admins cannot invite trainers/admins
- [ ] Email templates display correctly
- [ ] Bulk invitation works with CSV upload

### 🔍 **Testing Commands**

```sql
-- Check invited users
SELECT u.email, u.role, u."profileCompleted", u."createdAt"
FROM public."User" u
WHERE u."createdAt" > NOW() - INTERVAL '1 day'
ORDER BY u."createdAt" DESC;

-- Check auth users
SELECT au.email, au.email_confirmed_at, au.user_metadata
FROM auth.users au
WHERE au.created_at > NOW() - INTERVAL '1 day'
ORDER BY au.created_at DESC;
```

---

## Troubleshooting

### ❌ **Common Issues**

1. **Invitation not received**: Check email templates and SMTP settings
2. **Wrong role assigned**: Verify auth callback handles role parameter
3. **Permission denied**: Ensure inviter has ADMIN role
4. **Duplicate users**: Handle upsert conflicts properly
5. **Email template errors**: Check template syntax

### ✅ **Solutions**

```typescript
// Debug invitation flow
export async function debugInvitation(email: string) {
  const supabase = await createClient();
  
  // Check if user exists in auth
  const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
  
  // Check if user exists in User table
  const { data: dbUser } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single();
  
  console.log('Auth user:', authUser);
  console.log('DB user:', dbUser);
}
```

---

## Summary

You now have multiple methods to invite trainers and admins:

1. **🔧 Dashboard Method**: Quick manual invites with SQL role updates
2. **💻 Server Action Method**: Programmatic invites with proper role assignment
3. **🖥️ Admin Panel Method**: Full-featured admin interface
4. **📧 Bulk Method**: CSV upload for multiple invitations
5. **🎨 Custom Templates**: Branded invitation emails

**Recommended Approach**: Use **Method 2 (Server Action)** for production as it provides the best balance of automation, security, and user experience.

Your invitation system will now properly integrate with your RBAC implementation and Razorpay subscription system! 🚀
