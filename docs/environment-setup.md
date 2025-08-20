# Environment Setup for Trainer Invitation

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Service Role Key (Required for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How to Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. Add it to your `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## Security Note

⚠️ **NEVER expose the service role key to the browser**. It should only be used in server-side code.

The service role key bypasses Row Level Security (RLS) and has full database access.

## Testing the Setup

1. Add the environment variables
2. Restart your development server
3. Try inviting a trainer through the admin panel
4. Check the console for any errors

## Troubleshooting

- **Error: "User not allowed"** → Service role key is missing or incorrect
- **Error: "Missing environment variables"** → Check your `.env.local` file
- **Error: "Invalid JWT"** → Service role key format is incorrect
