# Backend request — Twin tag & check-in PIN

From: TruePas mobile app team · 2026-10-08
Base URL: `https://api.dev.truepas.com/cb`

Agreed at standup: twins look alike, so face match alone can't tell them apart at a venue. When a family member is added with the **Twin** relationship, they set their own 4-digit **check-in PIN**, and the kiosk asks for it as a second check.

The app side is built and runs against the mock API. It needs the items below to work against the real backend. Items are ordered by priority.

---

## 1. Twin tag on family members (HIGH)

`POST /family` already accepts `relationship` as free text. The app now sends `"relationship": "Twin"` for twins. This covers twin children, adult twins and the account holder's own twin.

**Needed**
- Treat `relationship == "Twin"` (case-insensitive) as the twin tag. A separate `isTwin` flag is fine too, if you prefer one. Tell us and we'll send it.
- No age or date-of-birth rule for Twin.

---

## 2. Set / change a twin's check-in PIN (HIGH)

```
PUT /family/{id}/check-in-pin
{ "pin": "4831" }
```

- `pin` is exactly 4 digits. Store it hashed, the same way as the account PIN. Never return it.
- **First set:** no extra header. This is the last step of adding a twin, just like a member's first face enrollment isn't PIN-gated.
- **Change (a PIN is already set):** requires `X-Reauth-Token` from `POST /auth/verify-pin` (the account holder's PIN). This is the same rule as `PUT /face`. Without it, return `403 REAUTH_REQUIRED`.
- **Reject** with `422` and a readable `message`:
  - the same PIN as the account holder's own PIN, or
  - the same PIN as another twin in the same family (otherwise the PIN can't tell them apart).

  Don't say *whose* PIN it matches. "Choose a different PIN" is enough.
- `404` for a member that isn't the caller's. `422` if the member isn't tagged Twin.
- **Response:** the full family member, like `PATCH /family/{id}/permissions`.

---

## 3. `checkInPinSet` on every family read (HIGH)

Add `"checkInPinSet": true | false` to `GET /family`, `GET /family/{id}` and the `POST /family` response.

The app uses it to show a twin as **"PIN needed"** until the PIN is set. Without the field, every twin stays "PIN needed" forever.

---

## 4. Kiosk check-in asks twins for their PIN (HIGH — kiosk + venue services)

- When the matched face belongs to a twin-tagged person, the kiosk shows a PIN pad before completing the check-in.
- Verify the entered PIN against **every twin in that family**, not just the top face match. The face narrows it down to the twins and the PIN picks which one, so a wrong top match still checks in the right person.
- If the PIN matches none of them, refuse the check-in. Lock out after 5 wrong tries (same policy as the account PIN) and record a failed check-in event.
- Never log or display the entered PIN.

---

## Open questions
1. Is "Twin" in `relationship` enough as the tag, or will you add a separate field?
2. Should the account holder's own twin with their **own** TruePas account also be prompted at the kiosk? They have their own account PIN, but nothing links the two accounts today.
3. Is a forgotten twin PIN reset only by the account holder through change (holder PIN first), or do you also want an email reset?
