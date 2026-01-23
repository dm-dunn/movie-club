# Movie Picking Workflow

## How It Works

### Phase 1: Picking (Current)
**Current Pickers:** Bree, Brooke, Alexis

All three users can pick simultaneously:
1. They visit their profile page
2. They see the Movie Picker interface
3. They search for and select a movie
4. Their pick is saved to the database
5. **Important:** They stay in the "available" array - their status doesn't change yet

### Phase 2: Reveal (Admin Action)
Once all three have picked (or when you're ready):
1. Admin calls: `POST /api/admin/season/reveal-picks`
2. This moves users who picked from "available" to "used"
3. Their picks are now "revealed" and visible in the used pickers list

### Phase 3: Next Group
When ready for the next group:
1. Admin calls: `POST /api/admin/season/reset`
2. Shuffles all active users
3. Selects next 3 random pickers
4. Creates new season

## Current Season Status

**Season 1:**
- **Already Revealed:** Alex, Cam, Dalton, Extra Credit, Hailey, Liam, Rhett (7 users)
- **Current Pickers:** Bree, Brooke, Alexis (3 users - can all pick now!)
- **Not in rotation:** Nick (will be in a future season)

## User Experience

### For Current Pickers (Bree, Brooke, Alexis)
**Before picking:**
- Profile shows: "Your Movie Club Movie Pick" with search interface
- They can search TMDB and select a movie
- Status: "current"

**After picking:**
- Profile shows: "You picked [Movie Title] this season, wait until next season!"
- They see their movie poster
- Status: "completed"

### For Users Who Already Picked
- See: "You picked [Movie Title] this season, wait until next season!"
- Movie poster displayed
- Status: "completed"

### For Users Not in Rotation
- No picker section shown on profile
- Status: "not_in_queue"

## Helper Scripts

### Check who has picked
```bash
npx tsx scripts/check-current-picks.ts
```

Output shows:
- Current pickers and whether they've picked
- Already revealed pickers
- Summary statistics

### View full season details
```bash
npx tsx scripts/show-season-details.ts
```

## Admin API Endpoints

### 1. Reveal Picks
**Endpoint:** `POST /api/admin/season/reveal-picks`

**What it does:**
- Checks which users in `availablePickerIds` have actually picked
- Moves them from `available` to `used`
- Returns list of revealed picks

**When to use:**
- After all 3 current pickers have picked
- Or when you're ready to reveal picks at your meeting

**Example Response:**
```json
{
  "success": true,
  "message": "Revealed 3 picks",
  "revealedPicks": [
    {
      "userName": "Bree",
      "movieTitle": "The Matrix",
      "movieYear": 1999
    },
    {
      "userName": "Brooke",
      "movieTitle": "Inception",
      "movieYear": 2010
    },
    {
      "userName": "Alexis",
      "movieTitle": "Interstellar",
      "movieYear": 2014
    }
  ],
  "remainingPickers": 0
}
```

### 2. Reset Season (Start New Group)
**Endpoint:** `POST /api/admin/season/reset`

**What it does:**
- Marks current season as completed
- Shuffles ALL active users (including those who already picked)
- Selects next 3 random pickers
- Creates new season

**When to use:**
- After revealing current picks
- When ready to start a new picking round

### 3. Check Season Status
**Endpoint:** `GET /api/admin/season/status`

**What it does:**
- Returns current season details
- Lists available and used pickers
- Shows current picker

## Technical Details

### Database State
```typescript
PickingSeason {
  seasonNumber: 1
  availablePickerIds: [Bree, Brooke, Alexis]  // Can all pick simultaneously
  usedPickerIds: [Alex, Cam, Dalton, ...]     // Already revealed
  currentPickerId: Bree                        // Not really used, all in available can pick
  isActive: true
}
```

### Pick Flow
1. User picks → `MoviePick` created with `pickRound = 1`
2. User stays in `availablePickerIds` (not moved yet)
3. Admin reveals → User moved to `usedPickerIds`
4. Admin resets → New season created with new 3 pickers

## Important Notes

- **All 3 pickers can pick at the same time** - they don't have to wait for each other
- **Picks are hidden until revealed** - users stay in "available" until admin reveals
- **Extra Credit is a special case** - Can be used for admin-added bonus movies
- **Nick is not in this season** - Will be included when season resets
- **Viewing Season vs Picking Season:**
  - Viewing Season (in Movie.viewingSeason): "Season 1" or "Classic Era"
  - Picking Season (in PickingSeason): Who can pick now
  - Pick Round (in MoviePick.pickRound): Which season the pick belongs to

## Workflow Summary

```
1. Admin sets up season with 3 pickers
   ↓
2. All 3 users can pick simultaneously
   ↓
3. Users submit picks (stored but not revealed)
   ↓
4. Admin calls reveal-picks (at meeting)
   ↓
5. Picks are moved to "used" and visible
   ↓
6. Admin calls reset when ready for next group
   ↓
7. New 3 pickers selected, repeat
```
