# Change Pick Feature

## Overview

Users can change their movie pick at any time **before the admin reveals** the picks. Once picks are revealed (moved from available to used), they can no longer be changed.

## User Experience

### Before Picking
- User sees movie picker interface
- Can search and select a movie

### After Picking (Not Yet Revealed)
- User sees their picked movie with poster
- Message: "You picked [Movie Title] this season!"
- **"Change Pick" button** is visible
- Clicking "Change Pick":
  1. Shows confirmation dialog
  2. Deletes their current pick
  3. Returns them to the movie picker interface
  4. Can select a new movie

### After Reveal (Picks Revealed)
- User sees their picked movie with poster
- Message: "You picked [Movie Title] this season, wait until next season!"
- **No "Change Pick" button** (cannot change after reveal)

## Technical Implementation

### API Endpoint: DELETE /api/user/delete-pick

**Authentication:** Required (user session)

**Checks:**
1. User is authenticated
2. Active season exists
3. User is in `availablePickerIds` (not revealed yet)
4. User has a pick for current season

**Actions:**
1. Deletes the MoviePick record
2. Returns success message

**Response:**
```json
{
  "success": true,
  "message": "Your pick \"Miracle\" has been removed. You can now pick a new movie."
}
```

**Errors:**
- `401`: Unauthorized (not logged in)
- `400`: No active picking season
- `403`: Cannot change pick after it has been revealed
- `404`: No pick found for this season

### Picker Status API Update

**GET /api/user/picker-status**

Now includes `canChangePick` field:

```json
{
  "status": "completed",
  "position": null,
  "seasonNumber": 1,
  "currentPicker": {...},
  "moviePick": {
    "id": "...",
    "title": "Miracle",
    "posterUrl": "...",
    "year": 2004
  },
  "canChangePick": true  // NEW FIELD
}
```

**Logic:**
```typescript
canChangePick = moviePick !== null && isInAvailable
```

- `true`: User has picked AND picks not yet revealed
- `false`: User hasn't picked OR picks already revealed

## State Flow

```
User picks movie
    ↓
status: "completed"
moviePick: { ... }
canChangePick: true
    ↓
[User can click "Change Pick"]
    ↓
Pick deleted
    ↓
status: "current"
moviePick: null
canChangePick: false
    ↓
[User picks new movie]
    ↓
status: "completed"
moviePick: { ... }
canChangePick: true
    ↓
[Admin reveals picks]
    ↓
User moved from available → used
canChangePick: false (permanently)
```

## Security Considerations

1. **User can only delete their own pick** - Session userId is used
2. **Cannot change after reveal** - Checks `availablePickerIds` array
3. **Confirmation dialog** - Prevents accidental deletions
4. **No cascading deletes** - Only the MoviePick is deleted, movie stays in DB

## Edge Cases

### Movie Cleanup
When a pick is deleted, the Movie record is NOT automatically deleted because:
- Other users might have picked the same movie
- It might have ratings
- It might be in personal rankings

The admin script `admin-delete-pick-simple.ts` suggests manual cleanup if needed.

### Multiple Changes
A user can change their pick multiple times before reveal:
- Pick Movie A
- Change to Movie B
- Change to Movie C
- All valid until admin reveals

### Timing Race Condition
If a user tries to change their pick at the exact moment admin reveals:
- API checks `availablePickerIds` first
- If user has been moved to `usedPickerIds`, change fails with 403
- User sees error message

## User Interface

### Completed Pick Card (Can Change)
```
┌────────────────────────────────┐
│     Movie Club Pick            │
│                                │
│ You picked Miracle this season!│
│                                │
│      [Movie Poster]            │
│         (2004)                 │
│                                │
│   [Change Pick] (button)       │
└────────────────────────────────┘
```

### Completed Pick Card (Cannot Change - Revealed)
```
┌────────────────────────────────┐
│     Movie Club Pick            │
│                                │
│ You picked Miracle this season,│
│   wait until next season!      │
│                                │
│      [Movie Poster]            │
│         (2004)                 │
│                                │
│    (no button)                 │
└────────────────────────────────┘
```

## Testing

### Test Scenario 1: Normal Change
1. User picks "Miracle"
2. User sees "Change Pick" button
3. User clicks "Change Pick"
4. Confirms dialog
5. Pick is deleted
6. User sees movie picker again
7. User picks "Inception"
8. User sees "Change Pick" button again

### Test Scenario 2: After Reveal
1. User picks "Miracle"
2. Admin reveals picks
3. User NO LONGER sees "Change Pick" button
4. User sees "wait until next season" message
5. API returns `canChangePick: false`

### Test Scenario 3: User Not in Rotation
1. User is not in `availablePickerIds`
2. User has no pick
3. User sees "not_in_queue" status
4. No picker section shown

## Admin Script Alternative

Admins can still delete picks using the script:
```bash
npx tsx scripts/admin-delete-pick-simple.ts <username>
```

This works regardless of reveal status (admin override).

## Future Enhancements

Possible improvements:
1. **Pick history** - Track all picks a user made (including deleted ones)
2. **Change limit** - Limit number of changes per season (e.g., max 3 changes)
3. **Change notification** - Notify admins when users change picks
4. **Undo feature** - Allow undoing a change within X minutes
