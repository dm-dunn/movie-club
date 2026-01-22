# Authentication Setup Guide

## Overview

The Movie Club app uses credential-based authentication with persistent sessions. Users must log in with their username and password to access their profile.

## Features

- Credential-based login (username + password)
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

## Managing Users

### Adding New Users

Create users with username, name, and password:

```bash
# Production (on Render)
npm run db:add-user "Full Name" username1 'password'

# Add an admin user
npm run db:add-user "Admin Name" admin1 'password' --admin

# Local development
npm run db:add-user:local "Full Name" username1 'password'
```

**Username Format:** Use firstname + number (e.g., john1, sarah1, dalton1)

### Listing Users

View all users in the database:

```bash
# Production
npm run db:list-users

# Local
npm run db:list-users:local
```

### Setting/Updating Passwords

Update an existing user's password:

```bash
# Production
npm run db:set-password username1 'newpassword'

# Local
npm run db:set-password:local username1 'newpassword'
```

### Recommended Workflow

1. Add users with the add-user script
2. Send username and temporary password to users securely
3. Users can log in with their username and password
4. For password resets, use the set-password script

## Database Migrations

Two migrations have been created for the authentication system:

1. **Add Password Field** (`20260121151708_add_password_to_user/migration.sql`)
   - Adds `password` column to users table

2. **Add Username Field** (`20260122104319_add_username_field/migration.sql`)
   - Adds `username` column to users table (unique, required)
   - Makes `email` column optional
   - Auto-generates usernames for existing users (firstname + 1)

When deploying to production:
- Migrations run automatically via `prisma migrate deploy` (configured in build script)
- Existing users will have usernames auto-generated from their first name

## Login Flow

1. User navigates to `/profile`
2. Middleware checks if user is authenticated
3. If not authenticated, user is redirected to `/login`
4. User enters username and password
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
