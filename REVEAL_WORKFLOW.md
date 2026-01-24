# Reveal Workflow - Clearing & Setting Watchlist

## Overview

When you reveal picks at your meeting, the system will:
1. **Clear the current watchlist** - Move all CURRENT movies to WATCHED
2. **Reveal new picks** - Move newly picked movies to CURRENT (new watchlist)
3. **Update season state** - Move pickers from available to used

## Current State

### Current Watchlist (4 movies)
Movies marked as `status: "CURRENT"` - ready to watch:
- Boogie Nights (1997) - Picked by Rhett
- Horns (2013) - Picked by Alex
- Lars and the Real Girl (2007) - Picked by Hailey
- Psycho (1960) - Picked by Extra Credit

### Pending Picks (Not Revealed Yet)
Movies picked but still `status: "UNWATCHED"`:
- Miracle (2004) - Picked by Alexis
- (Waiting for Bree and Brooke to pick)

### Already Watched (27 movies)
Movies marked as `status: "WATCHED"` - already seen

## The Reveal Process

### Step 1: Check Status
```bash
npx tsx scripts/check-watchlist.ts
```

Shows:
- Current watchlist movies
- Pending picks waiting to be revealed
- Summary statistics

### Step 2: Verify All Have Picked
```bash
npx tsx scripts/check-current-picks.ts
```

Shows:
- Which current pickers have picked (✅)
- Which haven't picked yet (⏳)
- Summary: "Have picked: X/3"

Wait until all 3 have picked before revealing!

### Step 3: Reveal at Meeting
```bash
POST /api/admin/season/reveal-picks
```

**What happens:**
1. **Current watchlist cleared:**
   - Boogie Nights → WATCHED
   - Horns → WATCHED
   - Lars and the Real Girl → WATCHED
   - Psycho → WATCHED

2. **New picks revealed:**
   - Miracle → CURRENT
   - Bree's pick → CURRENT
   - Brooke's pick → CURRENT

3. **Season updated:**
   - Alexis, Bree, Brooke → moved to usedPickerIds
   - availablePickerIds → empty (or next group if applicable)

**Example Response:**
```json
{
  "success": true,
  "message": "Revealed 3 picks",
  "watchlistCleared": 4,
  "newWatchlistAdded": 3,
  "revealedPicks": [
    {
      "userName": "Alexis",
      "movieTitle": "Miracle",
      "movieYear": 2004
    },
    {
      "userName": "Bree",
      "movieTitle": "The Departed",
      "movieYear": 2006
    },
    {
      "userName": "Brooke",
      "movieTitle": "Gone Girl",
      "movieYear": 2014
    }
  ],
  "remainingPickers": 0
}
```

## Movie Status Flow

```
UNWATCHED (default when picked)
    ↓
    (Admin reveals picks)
    ↓
CURRENT (on watchlist, ready to watch)
    ↓
    (Watch movie, mark as watched, or admin reveals next batch)
    ↓
WATCHED (already seen)
```

## Timeline Example

### Before Reveal
**Watchlist (CURRENT):**
- Boogie Nights
- Horns
- Lars and the Real Girl
- Psycho

**Hidden Picks (UNWATCHED):**
- Miracle (Alexis picked)
- [Bree's pick]
- [Brooke's pick]

### After Reveal
**Watchlist (CURRENT):**
- Miracle
- [Bree's pick]
- [Brooke's pick]

**Already Watched (WATCHED):**
- All 27 previous movies
- Plus: Boogie Nights, Horns, Lars and the Real Girl, Psycho

## Important Notes

1. **Timing:** Reveal when all 3 current pickers have picked
2. **At Meeting:** Do the reveal during your movie club meeting so everyone sees together
3. **Clearing Watchlist:** Old watchlist movies become "watched" even if you haven't actually watched them all yet
4. **Alternative:** If you want to keep tracking which ones you've actually watched, you might want a different field (like `actuallyWatched: boolean`)

## Helper Commands

### Check who needs to pick
```bash
npx tsx scripts/check-current-picks.ts
```

### See current vs pending watchlist
```bash
npx tsx scripts/check-watchlist.ts
```

### View full season details
```bash
npx tsx scripts/show-season-details.ts
```

## Admin API Workflow

1. **Before meeting:** Users pick movies (Bree, Brooke, Alexis)
2. **At meeting:** Admin calls `/api/admin/season/reveal-picks`
3. **After watching:** When ready for next group, call `/api/admin/season/reset`

## Technical Details

### Database Changes on Reveal

**Movies Table:**
```sql
-- Clear current watchlist
UPDATE movies SET status = 'WATCHED' WHERE status = 'CURRENT';

-- Add new picks to watchlist
UPDATE movies SET status = 'CURRENT'
WHERE id IN (newly_picked_movie_ids);
```

**PickingSeason Table:**
```sql
-- Move pickers from available to used
UPDATE picking_seasons
SET
  used_picker_ids = array_cat(used_picker_ids, picked_user_ids),
  available_picker_ids = array_remove_elements(available_picker_ids, picked_user_ids)
WHERE is_active = true;
```

## Future Enhancements

If you want to track actual watch progress separately from watchlist status:
1. Add `actuallyWatched: boolean` field to Movie
2. Keep `status: CURRENT` for current watchlist
3. Use `actuallyWatched` to track viewing progress
4. Only move to WATCHED when actually watched

For now, the system treats "cleared from watchlist" as "watched" for simplicity.
