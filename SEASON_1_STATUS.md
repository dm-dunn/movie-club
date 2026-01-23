# Season 1 Status

## Current State ✅

### Season Configuration
- **Season Number:** 1
- **Status:** Active
- **Created:** January 23, 2026

### Users Who Have Already Picked (7/10 users)
1. **Alex** - Horns (2013)
2. **Cam** - The Shawshank Redemption (1994)
3. **Dalton** - Frances Ha (2013)
4. **Extra Credit** - Psycho (1960) & The Town (2010)
5. **Hailey** - Lars and the Real Girl (2007)
6. **Liam** - Mystic River (2003)
7. **Rhett** - Boogie Nights (1997)

### Next Three Pickers (In Order)
1. **Bree** ▶ CURRENT PICKER - Can pick now!
2. **Brooke** - Up next after Bree
3. **Alexis** - Up after Brooke

### Users Not in This Season's Rotation
- **Nick** - Will pick in a future season

## How the Movie Picker Works

When it's your turn to pick:

1. **Visit Your Profile** - Navigate to your profile page
2. **See the Movie Picker** - The "Movie Club Pick" section shows a search interface
3. **Search for a Movie** - Type a movie title and press "Search"
4. **Real-time TMDB Search** - Results are fetched from The Movie Database (TMDB) in real-time
5. **Select Your Movie** - Click on a movie from the search results
6. **Confirm Your Pick** - Review the movie details and click "Confirm Pick"
7. **Submission** - Your pick is saved and the next person in line becomes the current picker

## For Users Who Already Picked

If you've already picked for Season 1, your profile will show:
- Your movie pick with poster
- Message: "You picked [Movie Title] this season, wait until next season!"

## Technical Details

### Pick Rounds
- **Classic Era**: pickRound = 0 (23 movies)
- **Season 1**: pickRound = 1 (8 movies picked so far)
- When new picks are made, they use pickRound = 1

### Database Structure
```typescript
PickingSeason {
  seasonNumber: 1
  availablePickerIds: [Bree, Brooke, Alexis]
  usedPickerIds: [Alex, Cam, Dalton, Extra Credit, Hailey, Liam, Rhett]
  currentPickerId: Bree's ID
  isActive: true
}
```

### API Endpoints Used
- `GET /api/user/picker-status` - Check if it's your turn
- `POST /api/user/submit-pick` - Submit your movie pick
- `GET /api/tmdb/search?query=...` - Search for movies
- `GET /api/tmdb/movie/[id]` - Get full movie details

## Admin Operations

### View Season Status
```bash
npx tsx scripts/show-season-details.ts
```

### Reset Season (When all 3 have picked)
```bash
POST /api/admin/season/reset
```
This will:
1. Mark current season as completed
2. Shuffle all active users
3. Select next 3 random pickers
4. Create new season

## Notes

- **Extra Credit** is treated as a special user for admin-added bonus movies
- **Nick** is not in this season's rotation and will be included in future seasons
- The system automatically moves users from "available" to "used" when they pick
- Once all 3 current pickers have picked, an admin must reset to start the next batch
