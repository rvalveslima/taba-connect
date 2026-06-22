## Fix Language filter on Attendees page

File: `src/routes/_authenticated/event.$eventId.index.tsx`

Currently the Language dropdown is built from whatever values exist in `accounts.languages` in the DB, which produces a messy mix (`English`, `Português`, plus raw codes `en`, `fr`, `de`, `ja`, `zh`...).

### Changes
1. Replace the dynamic `languageOptions` with a fixed, curated list (value = canonical code, label = display name):
   - English (`en`)
   - French (`fr`)
   - Portuguese (`pt`)
   - Spanish (`es`)
   - German (`de`)
2. Pass `{value,label}` options to `FilterPill` for Language (extend `FilterPill` to accept labeled options, or map at render). Other filters unchanged.
3. Update the filter predicate so it matches case-insensitively and accepts both the code and the full English name (e.g. selecting `en` matches attendees whose `languages` contains `"en"`, `"English"`, or `"english"`). This handles the inconsistent data already in the DB.

No DB/schema changes, no other filters touched.
