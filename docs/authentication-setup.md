# Authentication Setup Guide

## Overview

The Movie Club app now uses credential-based authentication with persistent sessions. Users must log in with their email and password to access their profile.

## Features

- Credential-based login (email + password)
- Persistent sessions with 30-day cookie
- Protected profile routes
- Secure password hashing with bcrypt
- Session management with NextAuth

## Environment Variables

Make sure these are set in your production environment:

```env
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-secure-random-secret-key
DATABASE_URL=your-production-database-url
```

To generate a secure `NEXTAUTH_SECRET`, run:
```bash
openssl rand -base64 32
```

## Setting User Passwords

### For New Users

When creating users in your database, you need to set their password. Use the provided script:

```bash
# Production (on Render)
npm run db:set-password <email> <password>

# Local development
DATABASE_URL="postgresql://..." npx tsx scripts/set-user-password.ts user@example.com their-password
```

### Password Script Usage

The `scripts/set-user-password.ts` script:
1. Takes an email and password as arguments
2. Hashes the password using bcrypt
3. Updates the user in the database

Example:
```bash
npx tsx scripts/set-user-password.ts john@example.com SecurePassword123
```

### Recommended Workflow

1. Create users in your database (using seed scripts or manually)
2. Generate a secure temporary password for each user
3. Use the set-password script to assign passwords
4. Send credentials to users securely (via email, Slack, etc.)
5. Instruct users to change their password on first login

## Database Migration

The password field has been added to the User model. When deploying to production:

1. The migration will run automatically via `prisma migrate deploy` (configured in build script)
2. The migration adds a `password` column to the `users` table
3. Existing users will get a default password that should be changed immediately

Migration file: `prisma/migrations/20260121151708_add_password_to_user/migration.sql`

## Login Flow

1. User navigates to `/profile`
2. Middleware checks if user is authenticated
3. If not authenticated, user is redirected to `/login`
4. User enters email and password
5. Credentials are validated against the database
6. On success, session cookie is created (30-day expiry)
7. User is redirected to `/profile`

## Protected Routes

The following routes require authentication:
- `/profile` - User profile page and all sub-routes

To add more protected routes, update the `middleware.ts` config:

```typescript
export const config = {
  matcher: ["/profile/:path*", "/your-new-protected-route/:path*"],
};
```

## API Routes

All user-specific API routes now require authentication:
- `GET /api/user/profile` - Returns authenticated user's profile
- `GET /api/user/top-4` - Returns authenticated user's top 4 movies
- `GET /api/user/picks` - Returns authenticated user's movie picks

Unauthenticated requests return `401 Unauthorized`.

## Security Considerations

1. **Password Storage**: Passwords are hashed with bcrypt (10 rounds)
2. **Session Security**: Sessions use JWT with 30-day expiry
3. **HTTPS Required**: In production, ensure NEXTAUTH_URL uses https://
4. **Secret Rotation**: Rotate NEXTAUTH_SECRET periodically
5. **Rate Limiting**: Consider adding rate limiting to login endpoint

## Troubleshooting

### "Invalid credentials" error
- Verify the user exists in the database
- Ensure the password was set using the script
- Check that `isActive` is `true` for the user

### Session not persisting
- Verify NEXTAUTH_SECRET is set
- Check cookie settings in browser
- Ensure NEXTAUTH_URL matches your domain

### Migration issues
- Ensure database connection string is correct
- Run `npx prisma migrate deploy` manually if needed
- Check migration history: `npx prisma migrate status`
