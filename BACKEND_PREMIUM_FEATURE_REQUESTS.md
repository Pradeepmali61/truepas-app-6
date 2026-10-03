# Backend requests: Truepas 3.0 premium UI

The approved Truepas 3.0 design includes features that the current API does not support. The app shows them now, greyed out with a **"Coming soon"** label, and they stay non-interactive until the endpoints below exist.

Each section lists what the screen shows, why it needs backend support, and a suggested contract. The contracts are proposals for discussion. They are not final.

---

## 1. Face check-in at venues (P0)

**Where it shows:**
- Home → "Today" card → **Check in with your face**
- Centre face button in the tab bar
- Sign in → **Sign in with your face**

**Why:** the app can only re-enrol a face (`PUT /face` after PIN). It has no way to check in at a booked venue from the phone, and no face-based login.

**Suggested contract**

`POST /bookings/:id/check-in` (multipart, the liveness frame from the existing liveness session)

Response:

```json
{ "status": "checked_in" | "rejected", "checkedInAt": "ISO", "matchScore": 0.0, "durationMs": 820 }
```

`POST /auth/face-login` (liveness session id + frame) returns the same tokens as `/auth/login`.

## 2. Digital key and scannable pass (P0)

**Where it shows:**
- Booking detail → navy **Digital key** card with QR (hotel room, park gate, flight seat, cinema seats, cruise cabin)
- Home → Quick actions → **Digital keys**, **Share identity**
- Identity → **QR pass** that refreshes every 60 seconds

**Suggested contract**

`GET /bookings/:id/pass`

```json
{ "kind": "room|gate|seat|cabin|entry", "label": "1208", "sublabel": "Floor 12 · Sea-facing", "qrPayload": "signed-token", "expiresAt": "ISO" }
```

`GET /user/me/pass` returns `{ "qrPayload": "signed-token", "expiresAt": "ISO" }`. The token is short-lived and signed, so screenshots can't be reused.

## 3. Richer booking detail (P1)

The `Booking` type has `venue, location, type, image, checkIn, checkOut, status, guests, amount, checkedInMembers`.

**The design also shows:**
- Venue kind: `hotel | park | flight | cinema | cruise | stadium | concert`
- A detail line (room type, seat, gate, deck)
- Confirmation code
- Check-out time
- Stay services: dining, spa, airport transfer, Wi-Fi, housekeeping

**Request:** add `kind`, `detail`, `confirmationCode` and `services[]` (`{ id, title, subtitle, status }`) to `GET /bookings/:id`.

## 4. Check-in stats (P2)

**Where it shows:** Check-ins tab → **"Your 2026 so far"** card: check-ins, cities, average check-in time, hours saved.

**Request:** `GET /user/me/stats?year=2026` returns:

```json
{ "checkIns": 24, "cities": 9, "avgCheckInMs": 3100, "minutesSaved": 360 }
```

## 5. Identity strength and security score (P2)

**Where it shows:**
- Wallet → **Identity strength** score
- Security → **score ring**, with a suggestion for how to improve it

**Request:** `GET /user/me/security-score` returns:

```json
{ "score": 92, "suggestions": [{ "id": "enable_2fa", "title": "Turn on 2-step sign-in", "points": 8 }] }
```

## 6. Sessions, devices and 2-step sign-in (P1)

**Where it shows:** Security → **Signed-in devices** (with sign-out) and the **2-step sign-in** toggle.

**Request:**
- `GET /auth/sessions` returns `[{ id, device, platform, city, lastActiveAt, current }]`
- `DELETE /auth/sessions/:id`
- `POST /auth/2fa/enable` and `POST /auth/2fa/disable`

## 7. Notifications (P1)

**Current:** read state is local only, and there is no server filter.

**Request:**
- `POST /notifications/:id/read`
- `POST /notifications/read-all`
- `GET /notifications?type=checkin|family|security|document`
- `GET /user/me/notification-preferences` and `PUT /user/me/notification-preferences`

## 8. Documents (P2)

**Where it shows:**
- Document detail → **Share securely**, **Recently used at**
- Wallet → **Add more** (Voter ID, Visa)

**Request:**
- `POST /documents/:id/share` returns a time-limited share link
- `GET /documents/:id/usage` returns `[{ venue, kind, usedAt }]`

**India document types:** the `DocumentType` enum has no Aadhaar, PAN or Voter ID. Product must first decide whether Truepas supports them (Regula support, compliance).

## 9. Family extras (P2)

**Where it shows:**
- Member detail → **Check in independently**, **Notify me on every check-in**
- Turns 18 → **Send invite** to hand over the identity

**Request:**
- `PATCH /family/:id/permissions` with `{ independentCheckIn: bool, notifyOnCheckIn: bool }`
- `POST /family/:id/handover-invite`
- A member photo URL on `FamilyMember`, so the portrait cards can show a real photo instead of initials

## 10. Settings and support (P3)

**Where it shows:** settings for biometric unlock, auto-show pass nearby, language and region, and Help → **Chat** / **Call** support.

**Request:** a user preferences endpoint, plus support-channel details or deep links.

---

All "Coming soon" markers live in the screens. Search the code for `SoonOverlay` and `ComingSoon` to find each one. When an endpoint ships, remove the wrapper on that screen and wire the hook.
