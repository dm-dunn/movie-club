# Picking Season System

## Overview

The Picking Season system manages the order in which users pick movies. It uses a randomized queue system where:

1. All active users are shuffled randomly
2. The next 3 users are selected as available pickers
3. When a user picks a movie, they move from "available" to "used"
4. Once all 3 users have picked, the admin can reset the season to select the next 3 pickers

## Database Schema

### PickingSeason Model

```prisma
model PickingSeason {
  id                  String    @id @default(uuid())
  seasonNumber        Int       @unique
  availablePickerIds  String[]  @default([])  // Users who haven't picked yet
  usedPickerIds       String[]  @default([])  // Users who have already picked
  currentPickerId     String?                 // The user whose turn it is
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  completedAt         DateTime?
}
```

## Admin API Endpoints

### POST /api/admin/season/reset

Resets the current season and creates a new one.

**Authentication:** Admin only

**Response:**
```json
{
  "success": true,
  "season": {
    "seasonNumber": 2,
    "nextThreePickers": [
      {
        "id": "user-id-1",
        "name": "John Doe",
        "profilePictureUrl": "https://..."
      },
      // ... 2 more pickers
    ],
    "totalUsers": 11,
    "remainingInPool": 8
  }
}
```

**What it does:**
- Gets all active users and shuffles them randomly (Fisher-Yates algorithm)
- Selects the first 3 users as the next pickers
- Marks the current active season as completed
- Creates a new season with the 3 selected pickers

### GET /api/admin/season/status

Gets the current season status.

**Authentication:** Admin only

**Response:**
```json
{
  "hasActiveSeason": true,
  "season": {
    "seasonNumber": 1,
    "currentPicker": {
      "id": "user-id",
      "name": "Jane Doe",
      "profilePictureUrl": "https://..."
    },
    "availablePickers": [/* array of users */],
    "usedPickers": [/* array of users */],
    "isComplete": false
  }
}
```

## User API Endpoints (Updated)

### GET /api/user/picker-status

Returns the current user's picker status.

**Response:**
```json
{
  "status": "current" | "next" | "upcoming" | "completed" | "not_in_queue",
  "position": 1,
  "seasonNumber": 1,
  "currentPicker": {
    "id": "user-id",
    "name": "Current Picker",
    "profilePictureUrl": "https://..."
  },
  "moviePick": {
    "id": "movie-id",
    "title": "Movie Title",
    "posterUrl": "https://...",
    "year": 2024
  }
}
```

### POST /api/user/submit-pick

Submits a movie pick for the current picker.

**Behavior:**
- Verifies user is the current picker
- Creates the movie if it doesn't exist
- Creates a MoviePick record
- Moves user from availablePickerIds to usedPickerIds
- Sets the next user in availablePickerIds as currentPickerId
- Marks season as completed if all pickers have picked

## Scripts

### Initialize Season

```bash
npx tsx scripts/initialize-season.ts
```

Creates the first picking season by:
- Shuffling all active users
- Selecting the first 3 as pickers
- Creating Season 1

### Check Season Status

```bash
npx tsx scripts/check-season-status.ts
```

Displays:
- Current season number and status
- Current picker
- Available pickers (in order)
- Completed pickers (with their movie selections)

## Workflow

### Initial Setup

1. Run `npx tsx scripts/initialize-season.ts` to create Season 1
2. The first user in the randomized list becomes the current picker

### User Picks a Movie

1. User goes to the pick page
2. System verifies they are the current picker
3. User selects a movie from TMDB
4. System moves them from available → used
5. System sets the next person as current picker

### Season Reset (Admin)

When all 3 users have picked:

1. Admin calls POST /api/admin/season/reset
2. System shuffles all active users again
3. System selects the next 3 pickers
4. Previous season is marked as completed
5. New season begins

## Example Flow

**Season 1:**
- Available: [Alice, Bob, Charlie]
- Current: Alice

**After Alice picks:**
- Available: [Bob, Charlie]
- Used: [Alice]
- Current: Bob

**After Bob picks:**
- Available: [Charlie]
- Used: [Alice, Bob]
- Current: Charlie

**After Charlie picks:**
- Available: []
- Used: [Alice, Bob, Charlie]
- Current: null
- Season marked as completed

**Admin resets:**
- New Season 2 created
- All users shuffled again
- New 3 pickers selected

## Migration Applied

Migration: `20260123215336_add_picking_season`

Creates the `picking_seasons` table with indexes on:
- `season_number` (unique)
- `is_active` (for quick lookups)
