# Onboarding Flow Documentation

## Overview
The app now includes a comprehensive onboarding flow that introduces new users to SignOff's features before they access the main app.

## User Flow

### First-Time User (New Registration)
1. User signs up with email/password
2. Account is created and keys are generated
3. User is automatically redirected to **Onboarding Screen** (5 slides)
4. After completing onboarding → Redirected to Home Screen
5. Onboarding status is saved (won't show again)

### First-Time User (Existing Account, First Login)
1. User logs in with credentials
2. System checks if onboarding was completed
3. If not completed → Redirected to **Onboarding Screen**
4. After completing onboarding → Redirected to Home Screen

### Returning User
1. User logs in with credentials
2. System detects onboarding was already completed
3. Directly redirected to **Home Screen** (skips onboarding)

### Manual Access
Users can revisit the onboarding anytime:
- Go to **Profile** tab
- Scroll to **Support** section
- Tap **"Revoir l'introduction"**
- View onboarding slides again

## Onboarding Slides

The onboarding consists of 5 informative slides:

1. **Welcome to SignOff**
   - Introduction to digital testament concept
   - Icon: shield-lock

2. **Encrypted Vaults**
   - Explains secure storage for passwords and documents
   - End-to-end encryption
   - Icon: lock-check

3. **Designate Heirs**
   - How to choose trusted people for data access
   - User maintains full control
   - Icon: account-heart

4. **Maximum Security**
   - Cryptographic key explanation
   - Privacy guarantee (even we can't access data)
   - Icon: shield-check

5. **Ready to Start**
   - Call to action
   - Encourages creating first vault and adding heirs
   - Icon: rocket-launch

## Features

### Navigation
- **Skip Button**: Top-right corner (all slides except last)
- **Back Button**: Navigate to previous slide (appears from slide 2)
- **Next Button**: Advance to next slide
- **Commencer Button**: Complete onboarding (last slide)
- **Pagination Dots**: Visual progress indicator

### UI/UX
- Smooth horizontal scrolling
- Purple-themed design matching app branding
- Large icons with colored backgrounds
- Clear, concise French text
- Responsive layout

## Technical Implementation

### Files Created
1. `contexts/OnboardingContext.tsx` - Manages onboarding state
2. `app/onboarding.tsx` - Onboarding screen component

### Files Modified
1. `app/_layout.tsx` - Added routing logic for onboarding
2. `contexts/AuthContext.tsx` - Removed direct navigation after signup
3. `app/(tabs)/profile.tsx` - Added "Revoir l'introduction" option

### State Management
- Uses AsyncStorage to persist onboarding completion status
- Key: `@signoff_onboarding_completed`
- Value: `'true'` when completed, absent when not

### Routing Logic
```
User Authentication Check
    ↓
Not Authenticated → Sign In
    ↓
Authenticated → Check Onboarding Status
    ↓
Not Completed → Onboarding Screen → Home
    ↓
Completed → Home Screen
```

## Testing

### Test Case 1: New User Registration
1. Clear app data/reinstall app
2. Sign up with new account
3. ✅ Should see onboarding after signup
4. Complete onboarding
5. ✅ Should land on home screen

### Test Case 2: Returning User Login
1. Log out
2. Log back in with same account
3. ✅ Should skip onboarding and go directly to home

### Test Case 3: Manual Onboarding Access
1. Go to Profile tab
2. Tap "Revoir l'introduction"
3. ✅ Should show onboarding slides
4. Complete or skip
5. ✅ Should return to app

### Test Case 4: Skip Onboarding
1. Clear app data
2. Sign up or log in
3. On onboarding screen, tap "Passer"
4. ✅ Should mark as completed and go to home

## Reset Onboarding (For Testing)

To reset onboarding status for testing:

```javascript
// In React Native Debugger or via code
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('@signoff_onboarding_completed');
```

Or use the Profile → "Revoir l'introduction" option which resets and shows it again.

## Console Logs

The app logs routing decisions:
- `🎓 Redirecting to onboarding...` - User needs to see onboarding
- `✅ Onboarding completed, redirecting to home...` - User completed onboarding

Monitor these logs to debug routing issues.
