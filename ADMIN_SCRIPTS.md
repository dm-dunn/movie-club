# Admin Scripts Reference

Quick reference for all admin and helper scripts.

## Viewing Information

### Check Current Season Status
```bash
npx tsx scripts/show-season-details.ts
```
Shows:
- Current season number and status
- Current picker(s)
- Available pickers (waiting to pick)
- Used pickers (already picked and revealed)
- Users not in rotation

### Check Who Has Picked
```bash
npx tsx scripts/check-current-picks.ts
```
Shows:
- Current pickers with ✅ (picked) or ⏳ (not picked yet)
- Already revealed pickers
- Summary: X/3 have picked
- Message when all have picked and ready to reveal

### Check Watchlist Status
```bash
npx tsx scripts/check-watchlist.ts
```
Shows:
- Current watchlist (CURRENT status movies)
- Pending picks not revealed yet
- Summary statistics
- What will happen on reveal

### List All Movies
```bash
npx tsx scripts/list-movies.ts
```
Shows all movies organized by:
- WATCHED (already seen)
- CURRENT (on watchlist)
- UNWATCHED (picked but not revealed yet)

### List All Users
```bash
npx tsx scripts/list-users.ts
```
Shows all users with their details.

## Managing Picks

### Delete a User's Pick
```bash
npx tsx scripts/admin-delete-pick-simple.ts <username>
```

**Examples:**
```bash
# Show all current picks
npx tsx scripts/admin-delete-pick-simple.ts

# Delete Alexis's pick
npx tsx scripts/admin-delete-pick-simple.ts Alexis

# Delete Bree's pick
npx tsx scripts/admin-delete-pick-simple.ts Bree
```

**What it does:**
- Finds the user's most recent pick for the current season
- Deletes the pick from the database
- User can now pick again
- Optionally suggests deleting the movie if it has no other uses

**Use cases:**
- Testing picks during development
- User picked wrong movie and wants to change
- Need to reset a user's pick for any reason

## Season Management

### Initialize First Season
```bash
npx tsx scripts/initialize-season.ts
```
Creates Season 1 with 3 random pickers.
**Note:** Only use this once at the start. After that, use the reset API.

### Reveal Picks (At Meeting)
```bash
POST /api/admin/season/reveal-picks
```

**What it does:**
1. Clears current watchlist (CURRENT → WATCHED)
2. Reveals new picks (UNWATCHED → CURRENT)
3. Moves pickers from available to used

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/admin/season/reveal-picks \
  -H "Cookie: your-session-cookie"
```

**Or use the API directly from your frontend**

### Reset Season (Start Next Group)
```bash
POST /api/admin/season/reset
```

**What it does:**
1. Marks current season as completed
2. Shuffles ALL active users
3. Selects next 3 random pickers
4. Creates new season

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/admin/season/reset \
  -H "Cookie: your-session-cookie"
```

## Fix/Setup Scripts

### Fix Current Season State
```bash
npx tsx scripts/fix-season-order.ts
```
Manually sets the current season state with specific users.
Used during setup/testing.

### Fix Pick Rounds
```bash
npx tsx scripts/fix-pick-rounds.ts
```
Categorizes picks into Classic Era (pickRound = 0) vs Season 1 (pickRound = 1).
Already run - shouldn't need to run again.

### Categorize Viewing Seasons
```bash
npx tsx scripts/categorize-viewing-seasons.ts
```
Sets viewingSeason field on movies ("Classic Era" vs "Season 1").
Already run - shouldn't need to run again.

## Typical Admin Workflow

### During Picking Phase
1. Users pick their movies (Bree, Brooke, Alexis)
2. Check progress: `npx tsx scripts/check-current-picks.ts`
3. If someone needs to change pick: `npx tsx scripts/admin-delete-pick-simple.ts <username>`

### At Meeting (Reveal)
1. Verify all have picked: `npx tsx scripts/check-current-picks.ts`
2. Check what will be revealed: `npx tsx scripts/check-watchlist.ts`
3. Call reveal API: `POST /api/admin/season/reveal-picks`
4. New watchlist is now active!

### After Watching Movies (Next Round)
1. When ready for next group: `POST /api/admin/season/reset`
2. New 3 random pickers selected
3. Repeat cycle

## Troubleshooting

### User can't pick
Check their status:
```bash
npx tsx scripts/check-current-picks.ts
```
- Should be in "Available pickers" section
- Should show ⏳ (not picked yet)

If they're not listed, they're not in the current picking rotation.

### Pick not showing up
```bash
npx tsx scripts/check-current-picks.ts
```
Should show ✅ next to their name.

### Want to see database directly
```bash
npx prisma studio
```
Opens Prisma Studio GUI to browse all database tables.

## Quick Commands Summary

```bash
# Most used commands
npx tsx scripts/check-current-picks.ts              # Who has picked?
npx tsx scripts/check-watchlist.ts                  # What's on watchlist?
npx tsx scripts/admin-delete-pick-simple.ts Alexis  # Delete a pick
npx tsx scripts/show-season-details.ts              # Full season details

# Admin API calls (use from frontend or curl)
POST /api/admin/season/reveal-picks    # Reveal picks at meeting
POST /api/admin/season/reset           # Start next picking round
GET  /api/admin/season/status          # View season status

# One-time setup scripts (already run)
npx tsx scripts/initialize-season.ts
npx tsx scripts/fix-pick-rounds.ts
npx tsx scripts/categorize-viewing-seasons.ts
```
