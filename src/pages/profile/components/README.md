# Profile Page Components

This directory contains the modular components for the user profile page.

## Component Structure

### Main Components

- **`AnimatedBackground.tsx`** - Handles the animated background elements including the moving ping pong ball
- **`Header.tsx`** - Navigation header with branding and menu items
- **`ProfileHeader.tsx`** - User profile information section with avatar, stats, and action buttons
- **`TabNavigation.tsx`** - Tab navigation component for switching between different profile sections

### Tab Content Components

- **`OverviewTab.tsx`** - Overview section with performance stats, streaks, and head-to-head comparison
- **`MatchesTab.tsx`** - Recent matches history
- **`AchievementsTab.tsx`** - User achievements and badges
- **`TournamentsTab.tsx`** - Tournament participation history

### Support Files

- **`types.ts`** - TypeScript type definitions for all profile-related data structures
- **`index.ts`** - Barrel export file for easy component imports

## Usage

All components are exported from the `index.ts` file for convenient importing:

```tsx
import {
  AnimatedBackground,
  Header,
  ProfileHeader,
  TabNavigation,
  OverviewTab,
  MatchesTab,
  AchievementsTab,
  TournamentsTab,
  ProfileUser,
  Match,
  Achievement,
  Tournament,
  MutualMatch,
  Tab,
} from "./components"
```

## Benefits of This Structure

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to maintain and update individual components
4. **Testing**: Each component can be tested independently
5. **Type Safety**: Comprehensive TypeScript types for all data structures
6. **Code Organization**: Clear separation of concerns and logical grouping
