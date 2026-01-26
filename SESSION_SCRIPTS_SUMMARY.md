# Session Scripts Summary

This document summarizes all the scripts created during this build session for the Movie Club picking season system.

## Scripts Created This Session

### 1. Initialize Season
**File:** `scripts/initialize-season.ts`

**Purpose:** Create the first picking season with 3 random pickers.

**What it does:**
- Gets all active users
- Shuffles them randomly (Fisher-Yates algorithm)
- Selects first 3 as next pickers
- Creates Season 1 with those 3 users in `availablePickerIds`
- Sets first user as `currentPickerId`

**When to use:** Only at the very beginning to create Season 1. After that, use the `/api/admin/season/reset` endpoint.

**Command:**
```bash
npx tsx scripts/initialize-season.ts
```

**Output:**
```
✅ Season initialized successfully!
Season Number: 1
Next 3 Pickers (in order):
  ▶ 1. Brooke
    2. Extra Credit
    3. Rhett
```

---

### 2. Check Season Status
**File:** `scripts/check-season-status.ts`

**Purpose:** View the current picking season details.

**What it does:**
- Shows season number and status (Active/Completed)
- Lists current picker
- Shows available pickers in order
- Shows completed pickers with their movie picks
- Provides summary statistics

**When to use:** Anytime you want to see who can pick and who has picked.

**Command:**
```bash
npx tsx scripts/check-season-status.ts
```

**Output:**
```
Season Number: 1
Created: 1/23/2026, 2:58:07 PM
Status: ▶ Active

▶ Current Picker: Bree

📋 Available Pickers (in order):
  ▶ 1. Bree (CURRENT)
    2. Brooke (Position 2)
    3. Alexis (Position 3)

✅ Completed Pickers:
  (None yet)
```

---

### 3. Show Season Details
**File:** `scripts/show-season-details.ts`

**Purpose:** Detailed view of season with ALL users categorized.

**What it does:**
- Shows current season info
- Lists current pickers (can pick now)
- Lists revealed pickers (already moved to used)
- Lists users NOT in rotation
- Shows who has picks for this season vs who will pick in future

**When to use:** When you need full visibility of all users and their status.

**Command:**
```bash
npx tsx scripts/show-season-details.ts
```

**Output:**
```
📋 AVAILABLE PICKERS (Waiting to Pick):
  ▶ 1. Bree (CURRENT)
    2. Brooke (Position 2)
    3. Alexis (Position 3)

✅ REVEALED PICKERS (Already moved to used):
  • Alex - Horns (2013)
  • Cam - The Shawshank Redemption (1994)
  ...

⏸️  USERS NOT IN THIS SEASON'S PICKING ROTATION:
  • Nick - Will pick in a future season
```

---

### 4. Check Current Picks
**File:** `scripts/check-current-picks.ts`

**Purpose:** See which current pickers have picked and which haven't.

**What it does:**
- Shows current pickers with ✅ (picked) or ⏳ (not picked yet)
- Lists already revealed pickers
- Provides summary: "Have picked: X/3"
- Shows message when all have picked and ready to reveal

**When to use:**
- During picking phase to track progress
- Before revealing to ensure all 3 have picked

**Command:**
```bash
npx tsx scripts/check-current-picks.ts
```

**Output:**
```
📋 CURRENT PICKERS (Can pick now):
  ⏳ Bree - Not picked yet
  ⏳ Brooke - Not picked yet
  ✅ Alexis - Picked: Miracle (2004)

📊 SUMMARY:
   • Current group size: 3
   • Have picked: 1/3
   • Not picked yet: 2

(When all picked:)
   ✅ All current pickers have picked! Ready to reveal.
   Run: POST /api/admin/season/reveal-picks
```

---

### 5. Check Watchlist
**File:** `scripts/check-watchlist.ts`

**Purpose:** See current watchlist vs pending picks to be revealed.

**What it does:**
- Shows CURRENT watchlist (status = "CURRENT")
- Shows pending picks not revealed yet (status = "UNWATCHED")
- Explains what will happen on reveal
- Provides summary statistics

**When to use:**
- Before revealing to see what will change
- To understand watchlist status

**Command:**
```bash
npx tsx scripts/check-watchlist.ts
```

**Output:**
```
🎬 CURRENT WATCHLIST (Movies to watch):
  • Boogie Nights (1997) - Picked by Rhett
  • Horns (2013) - Picked by Alex
  • Lars and the Real Girl (2007) - Picked by Hailey
  • Psycho (1960) - Picked by Extra Credit

📋 PENDING PICKS (Not revealed yet):
  • Miracle (2004) - Picked by Alexis

💡 What happens when you reveal:
   1. Current watchlist cleared (movies → WATCHED)
   2. Pending picks revealed (movies → CURRENT)
   3. New watchlist ready to watch!
```

---

### 6. Admin Delete Pick (Simple)
**File:** `scripts/admin-delete-pick-simple.ts`

**Purpose:** Admin tool to delete any user's pick.

**What it does:**
- Takes username as command-line argument
- Finds user's most recent pick for current season
- Deletes the pick
- User can pick again
- Suggests movie cleanup if movie has no other uses

**When to use:**
- Testing during development
- User needs to change pick (before they had the feature)
- Admin override needed

**Command:**
```bash
# Show all current picks
npx tsx scripts/admin-delete-pick-simple.ts

# Delete specific user's pick
npx tsx scripts/admin-delete-pick-simple.ts Alexis
```

**Output:**
```
✅ Pick deleted successfully!
Alexis can now pick again for Season 1

💡 Movie has no other picks, ratings, or rankings.
   You can delete it with: [command to delete movie]
```

---

### 7. Fix Pick Rounds
**File:** `scripts/fix-pick-rounds.ts`

**Purpose:** Categorize picks into Classic Era (pickRound = 0) vs Season 1 (pickRound = 1).

**What it does:**
- Sets all picks to pickRound = 0 (Classic Era)
- Updates Season 1 movie picks to pickRound = 1
- Verifies the changes
- Shows Season 1 picks by user

**When to use:** Already run during setup. Shouldn't need to run again unless you add more historical data.

**Command:**
```bash
npx tsx scripts/fix-pick-rounds.ts
```

**Output:**
```
✅ Updated 23 picks to Classic Era
✅ Updated 8 picks to Season 1

📊 Verification:
   • Classic Era picks (pickRound = 0): 23
   • Season 1 picks (pickRound = 1): 8
```

---

### 8. Categorize Viewing Seasons
**File:** `scripts/categorize-viewing-seasons.ts`

**Purpose:** Set `viewingSeason` field on movies ("Classic Era" vs "Season 1").

**What it does:**
- Updates Season 1 movies to `viewingSeason: "Season 1"`
- Updates all other movies to `viewingSeason: "Classic Era"`
- Shows summary by viewing season
- Lists all Classic Era movies

**When to use:** Already run during setup. Shouldn't need to run again unless you add more movies.

**Command:**
```bash
npx tsx scripts/categorize-viewing-seasons.ts
```

**Output:**
```
✅ Updated 8 movies to "Season 1"
✅ Updated 23 movies to "Classic Era"

📊 Summary by Viewing Season:
  Classic Era: 23 movies
  Season 1: 8 movies
```

---

### 9. Fix Season Order
**File:** `scripts/fix-season-order.ts`

**Purpose:** Manually set current season state with specific users.

**What it does:**
- Sets specific users as having picked (moved to usedPickerIds)
- Sets specific users as next pickers (in availablePickerIds)
- Updates currentPickerId

**When to use:** During setup/testing to manually configure season state. Not needed during normal operation.

**Command:**
```bash
npx tsx scripts/fix-season-order.ts
```

---

### 10. Fix Current Season State
**File:** `scripts/fix-current-season-state.ts`

**Purpose:** Another manual setup script for season state.

**What it does:** Similar to fix-season-order but with different user lists.

**When to use:** During setup/testing. Not needed during normal operation.

---

### 11. List Movies
**File:** `scripts/list-movies.ts`

**Purpose:** List all movies in the database organized by status.

**What it does:**
- Shows WATCHED movies with ratings
- Shows CURRENT movies (on watchlist)
- Shows UNWATCHED movies
- Includes picker info, ratings, and Oscar data

**When to use:** When you want to see all movies and their details.

**Command:**
```bash
npx tsx scripts/list-movies.ts
```

---

## Admin API Endpoints (Not Scripts, but Important)

### 1. Reveal Picks
**Endpoint:** `POST /api/admin/season/reveal-picks`

**What it does:**
1. Clears current watchlist (CURRENT → WATCHED)
2. Reveals new picks (UNWATCHED → CURRENT)
3. Moves pickers from available to used

**Response:**
```json
{
  "success": true,
  "message": "Revealed 3 picks",
  "watchlistCleared": 4,
  "newWatchlistAdded": 3,
  "revealedPicks": [...]
}
```

---

### 2. Reset Season
**Endpoint:** `POST /api/admin/season/reset`

**What it does:**
1. Marks current season as completed
2. Shuffles ALL active users
3. Selects next 3 random pickers
4. Creates new season

**Response:**
```json
{
  "success": true,
  "season": {
    "seasonNumber": 2,
    "nextThreePickers": [...],
    "totalUsers": 11,
    "remainingInPool": 8
  }
}
```

---

### 3. Season Status
**Endpoint:** `GET /api/admin/season/status`

**What it does:** Returns current season details via API.

---

## User API Endpoints

### 1. Delete Pick
**Endpoint:** `DELETE /api/user/delete-pick`

**What it does:**
- Deletes user's own pick (if not revealed yet)
- Allows them to pick again

---

## Quick Reference Workflow

### During Picking Phase
```bash
# Check who has picked
npx tsx scripts/check-current-picks.ts

# See full details
npx tsx scripts/show-season-details.ts

# Delete someone's pick (admin)
npx tsx scripts/admin-delete-pick-simple.ts Username
```

### Before Revealing at Meeting
```bash
# Verify all have picked
npx tsx scripts/check-current-picks.ts

# See what will change
npx tsx scripts/check-watchlist.ts
```

### At Meeting - Reveal
```bash
# Call API endpoint
POST /api/admin/season/reveal-picks
```

### After Watching - Next Round
```bash
# Call API endpoint
POST /api/admin/season/reset
```

---

## Script Categories

### Information/Viewing (Safe to run anytime)
- ✅ `check-season-status.ts`
- ✅ `show-season-details.ts`
- ✅ `check-current-picks.ts`
- ✅ `check-watchlist.ts`
- ✅ `list-movies.ts`

### Admin Actions (Use with caution)
- ⚠️ `admin-delete-pick-simple.ts` - Deletes picks

### Setup/One-Time (Already run)
- 🔧 `initialize-season.ts`
- 🔧 `fix-pick-rounds.ts`
- 🔧 `categorize-viewing-seasons.ts`
- 🔧 `fix-season-order.ts`
- 🔧 `fix-current-season-state.ts`

---

## Summary

**Total Scripts Created:** 11
**API Endpoints Created:** 5 (3 admin, 2 user)

**Most Used:**
1. `check-current-picks.ts` - Track picking progress
2. `check-watchlist.ts` - See watchlist before reveal
3. `admin-delete-pick-simple.ts` - Delete picks for testing
4. `show-season-details.ts` - Full season overview
5. `POST /api/admin/season/reveal-picks` - Reveal picks

All scripts are designed to work together to manage the complete picking season workflow from initialization through reveal to reset.
