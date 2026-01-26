# Complete Movie Club Picking Workflow

## System Overview

This document provides a complete visual workflow of the entire movie club picking season system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PickingSeason                                               │
│  ├─ seasonNumber: 1                                         │
│  ├─ availablePickerIds: [Bree, Brooke, Alexis]             │
│  ├─ usedPickerIds: [Alex, Cam, Dalton, ...]                │
│  ├─ currentPickerId: Bree                                   │
│  └─ isActive: true                                          │
│                                                              │
│  Movie                                                       │
│  ├─ status: UNWATCHED / CURRENT / WATCHED                   │
│  ├─ viewingSeason: "Season 1" / "Classic Era"               │
│  └─ ... other fields                                        │
│                                                              │
│  MoviePick                                                   │
│  ├─ userId: reference to User                               │
│  ├─ movieId: reference to Movie                             │
│  └─ pickRound: 0 (Classic Era) / 1 (Season 1)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: INITIALIZATION (One-time setup)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  npx tsx scripts/initialize-season.ts
                              │
                              ▼
          ┌─────────────────────────────────────────┐
          │   Season 1 Created                      │
          │   - 3 random pickers selected           │
          │   - Added to availablePickerIds         │
          │   - First user = currentPickerId        │
          └─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: PICKING (Users pick their movies)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌─────────────────────────────────────────┐
          │  Bree, Brooke, Alexis can all pick      │
          │  simultaneously                          │
          └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌────────┐           ┌────────┐           ┌────────┐
   │  Bree  │           │ Brooke │           │ Alexis │
   │ visits │           │ visits │           │ visits │
   │profile │           │profile │           │profile │
   └───┬────┘           └───┬────┘           └───┬────┘
       │                    │                    │
       ▼                    ▼                    ▼
   Sees Movie          Sees Movie          Sees Movie
   Picker UI           Picker UI           Picker UI
       │                    │                    │
       ▼                    ▼                    ▼
   Searches TMDB       Searches TMDB       Searches TMDB
       │                    │                    │
       ▼                    ▼                    ▼
   Selects Movie       Selects Movie       Selects Movie
       │                    │                    │
       ▼                    ▼                    ▼
   Confirms Pick       Confirms Pick       Confirms Pick
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
          ┌─────────────────────────────────────────┐
          │  MoviePick created                      │
          │  - status: UNWATCHED                    │
          │  - pickRound: 1                         │
          │  - User stays in availablePickerIds     │
          └─────────────────────────────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────────┐
          │  User sees completed pick               │
          │  - Shows movie poster                   │
          │  - "Change Pick" button available       │
          └─────────────────────────────────────────┘
                            │
       ┌────────────────────┴────────────────────┐
       │                                         │
       ▼                                         ▼
   Keep Pick                             Change Pick?
       │                                         │
       │                                         ▼
       │                          DELETE /api/user/delete-pick
       │                                         │
       │                                         ▼
       │                          Pick deleted, can pick again
       │                                         │
       └─────────────────┬───────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ MONITORING: Check Progress (Admin)                          │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  check-current-   check-watchlist   show-season-
    picks.ts          .ts             details.ts
        │                │                │
        ▼                ▼                ▼
   Shows who        Shows current    Full season
   has picked       watchlist vs     overview with
   (✅/⏳)          pending picks    all users
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
          All 3 have picked? Wait for meeting
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: REVEAL (At movie club meeting)                     │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
            POST /api/admin/season/reveal-picks
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Clear Current    Reveal Picks     Move Users
   Watchlist        to Watchlist     to Used
        │                │                │
        ▼                ▼                ▼
   4 movies        3 new movies     Bree, Brooke,
   CURRENT →       UNWATCHED →      Alexis moved to
   WATCHED         CURRENT          usedPickerIds
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
          ┌─────────────────────────────────────────┐
          │  NEW WATCHLIST REVEALED                 │
          │  - Old movies now WATCHED               │
          │  - New movies now CURRENT               │
          │  - Users can no longer change picks     │
          └─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: WATCHING (Group watches the new picks)             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              Watch the 3 new movies
                         │
                         ▼
              (Optional: Rate movies)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: RESET (Start next picking round)                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              POST /api/admin/season/reset
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Mark current     Shuffle ALL      Select next
   season as        active users     3 random
   completed                         pickers
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
          ┌─────────────────────────────────────────┐
          │  NEW SEASON CREATED (Season 2)          │
          │  - Season 1 marked completed            │
          │  - New 3 pickers in availablePickerIds  │
          │  - Everyone else gets chance later      │
          └─────────────────────────────────────────┘
                         │
                         ▼
              Return to PHASE 2 (Picking)
```

## State Transitions

### Movie Status Flow
```
UNWATCHED (picked but not revealed)
    │
    │ Admin reveals
    ▼
CURRENT (on watchlist, ready to watch)
    │
    │ Admin reveals next batch OR manually set
    ▼
WATCHED (already seen)
```

### User Picker Status Flow
```
NOT IN ROTATION
    │
    │ Season reset includes user
    ▼
IN AVAILABLE PICKERS (can pick now)
    │
    ├─► Picks movie → status: completed (still in available)
    │                  │
    │                  │ Can change pick
    │                  ▼
    │             Deletes pick → back to "can pick now"
    │
    │ Admin reveals
    ▼
IN USED PICKERS (pick revealed, wait for next season)
    │
    │ Season reset
    ▼
BACK TO NOT IN ROTATION (or selected again)
```

## Key Decision Points

### Can User Change Pick?
```
Has user picked?
    │
    ├─► NO → Show movie picker
    │
    └─► YES
          │
          Is user in availablePickerIds?
              │
              ├─► YES → Show "Change Pick" button
              │
              └─► NO → Show "wait until next season"
```

### Should Admin Reveal?
```
Check: npx tsx scripts/check-current-picks.ts
    │
    Have all 3 picked?
        │
        ├─► NO → Wait for remaining picks
        │
        └─► YES
              │
              Ready to reveal at meeting?
                  │
                  ├─► NO → Wait for meeting
                  │
                  └─► YES → POST /api/admin/season/reveal-picks
```

### Should Admin Reset Season?
```
Have all current pickers been revealed?
    │
    ├─► NO → Wait for reveal
    │
    └─► YES
          │
          Ready for next group of 3?
              │
              ├─► NO → Continue watching/rating
              │
              └─► YES → POST /api/admin/season/reset
```

## Data Relationships

```
PickingSeason (1) ───────────────┐
                                 │
User (many) ──────────────────┐  │
    │                         │  │
    │ picks                   │  │
    ▼                         │  │
MoviePick (many)              │  │
    │                         │  │
    │ references              │  │
    ▼                         │  │
Movie (1)                     │  │
    │                         │  │
    │ has status              │  │
    ▼                         │  │
UNWATCHED/CURRENT/WATCHED ────┴──┴─► Controlled by admin actions
```

## Time-Based View

```
Week 1: Initialize Season
  └─► 3 users selected randomly

Week 2-3: Picking Phase
  ├─► Users pick movies
  ├─► Users can change picks
  └─► Admin monitors progress

Week 4: Meeting & Reveal
  ├─► Verify all picked
  ├─► Admin reveals at meeting
  └─► New watchlist active

Week 5-8: Watching Phase
  ├─► Watch the 3 movies
  ├─► Rate movies
  └─► Discuss at meetings

Week 9: Reset & Repeat
  └─► Admin resets, new 3 pickers selected

... cycle continues ...
```

## Summary

- **11 scripts** for management and monitoring
- **5 API endpoints** for admin and user actions
- **3 phases** in each picking cycle
- **3 users** pick simultaneously per cycle
- **Unlimited changes** before reveal
- **No changes** after reveal
- **Complete cycle** takes ~8-9 weeks per group

The system is designed to be flexible, allowing users to change their minds while maintaining integrity after reveals.
