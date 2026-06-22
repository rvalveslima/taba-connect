## Plan

Fix the attendee demo flow so clicking **“I’m here for the demo →”** from the Shebuilds join page reliably takes the judge to create their attendee profile.

### Steps

1. **Adjust demo attendee sign-in flow**
   - Keep the one-click demo attendee button only on the event join/login screen.
   - After signing in as the demo attendee, always navigate to `/event/$eventId/profile`.
   - Do not let an existing pre-seeded membership/dashboard state bypass the profile creation screen.

2. **Make profile setup handle the demo account cleanly**
   - Ensure the profile page can load when the demo attendee already has an event membership.
   - Let the judge update/create the visible profile details before entering the attendee dashboard.

3. **Preserve the seeded fake attendee dashboard**
   - Keep the 20 fake profiles available for the Shebuilds demo dashboard.
   - Keep the LinkedIn fake-data message when clicking the LinkedIn CTA for generated profiles.

4. **Verify end-to-end**
   - Test the exact path: organizer signs out → join page → click **“I’m here for the demo →”** → lands on profile creation.
   - Confirm profile submission then leads to the attendee dashboard with the generated profiles.