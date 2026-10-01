/** Static showcase data — every premium screen renders from this file. */
import type { ImgKey } from "./images";

export const USER = {
  first: "Pradeep",
  name: "Pradeep Mali",
  id: "TP 4821 7730",
  since: "Mar 2026",
  phone: "+91 98765 43210",
  email: "pradeep.mali@example.com",
  dob: "14 Aug 1994",
  nationality: "Indian",
  city: "Mumbai, Maharashtra",
  image: "user" as ImgKey,
};

export type TripKind = "hotel" | "park" | "flight" | "cinema" | "cruise" | "stadium" | "concert";

export interface Trip {
  id: string;
  kind: TripKind;
  title: string;
  place: string;
  when: string;
  detail: string;
  image: ImgKey;
  status: "ready" | "upcoming" | "checked-in" | "completed";
  guests: number;
}

export const KIND_LABEL: Record<TripKind, string> = {
  hotel: "Hotel",
  park: "Theme park",
  flight: "Flight",
  cinema: "Cinema",
  cruise: "Cruise",
  stadium: "Stadium",
  concert: "Live event",
};

export const UPCOMING: Trip[] = [
  {
    id: "t1",
    kind: "hotel",
    title: "Marine Bay Grand",
    place: "Colaba, Mumbai",
    when: "Today · from 2:00 PM",
    detail: "Deluxe Sea View · 2 nights",
    image: "hotelDusk",
    status: "ready",
    guests: 2,
  },
  {
    id: "t2",
    kind: "park",
    title: "Celestia Wonderland",
    place: "Lonavala",
    when: "Tomorrow · 10:30 AM",
    detail: "Family day pass · Fast lane",
    image: "themepark",
    status: "upcoming",
    guests: 4,
  },
  {
    id: "t3",
    kind: "flight",
    title: "Mumbai → Jaipur",
    place: "BOM T2 · Gate B12",
    when: "Sat, 4 Oct · 06:45",
    detail: "SkyLine 864 · Seat 3A",
    image: "flight",
    status: "upcoming",
    guests: 1,
  },
  {
    id: "t4",
    kind: "cinema",
    title: "Midnight Monsoon",
    place: "Lumière IMAX, Lower Parel",
    when: "Sat, 4 Oct · 7:30 PM",
    detail: "Recliner · F11 – F14",
    image: "cinema",
    status: "upcoming",
    guests: 4,
  },
  {
    id: "t5",
    kind: "cruise",
    title: "Coral Voyager",
    place: "Goa → Lakshadweep",
    when: "12 – 16 Oct",
    detail: "Ocean suite · Deck 9",
    image: "cruise",
    status: "upcoming",
    guests: 2,
  },
];

export const PAST: Trip[] = [
  {
    id: "p1",
    kind: "hotel",
    title: "Aravali Palace",
    place: "Jaipur, Rajasthan",
    when: "21 Sep · 3:12 PM",
    detail: "Checked in in 4 seconds",
    image: "jaipur",
    status: "completed",
    guests: 2,
  },
  {
    id: "p2",
    kind: "stadium",
    title: "T20 Final",
    place: "Mumbai Arena",
    when: "14 Sep · 6:40 PM",
    detail: "North Stand · Gate 4",
    image: "stadium",
    status: "completed",
    guests: 3,
  },
  {
    id: "p3",
    kind: "hotel",
    title: "Sunset Bay Resort",
    place: "Candolim, Goa",
    when: "2 Sep · 12:05 PM",
    detail: "Pool villa · 3 nights",
    image: "resort",
    status: "completed",
    guests: 4,
  },
  {
    id: "p4",
    kind: "concert",
    title: "Neon Nights Live",
    place: "Dome Arena, Worli",
    when: "23 Aug · 8:15 PM",
    detail: "GA · Wristband issued",
    image: "concert",
    status: "completed",
    guests: 2,
  },
];

export interface Member {
  id: string;
  name: string;
  relation: string;
  age: number;
  image: ImgKey;
  status: "verified" | "pending";
}

export const FAMILY: Member[] = [
  { id: "m1", name: "Ananya Mali", relation: "Spouse", age: 31, image: "wife", status: "verified" },
  { id: "m2", name: "Kiara Mali", relation: "Daughter", age: 7, image: "child", status: "verified" },
  { id: "m3", name: "Rajesh Mali", relation: "Father", age: 64, image: "father", status: "pending" },
  { id: "m4", name: "Meera Mali", relation: "Sister", age: 18, image: "sister", status: "verified" },
];

export type DocKind = "passport" | "aadhaar" | "license" | "pan";

export interface Doc {
  id: string;
  kind: DocKind;
  title: string;
  issuer: string;
  number: string;
  expires: string;
  status: "verified" | "review";
  colors: readonly [string, string];
}

export const DOCS: Doc[] = [
  {
    id: "d1",
    kind: "passport",
    title: "Passport",
    issuer: "Republic of India",
    number: "Z•••• 4821",
    expires: "Exp. Jan 2033",
    status: "verified",
    colors: ["#0B3A5B", "#021B2B"],
  },
  {
    id: "d2",
    kind: "aadhaar",
    title: "Aadhaar",
    issuer: "UIDAI",
    number: "•••• •••• 7730",
    expires: "No expiry",
    status: "verified",
    colors: ["#08B6FC", "#0574A8"],
  },
  {
    id: "d3",
    kind: "license",
    title: "Driving Licence",
    issuer: "Maharashtra RTO",
    number: "MH01 •••• 2019",
    expires: "Exp. Aug 2034",
    status: "verified",
    colors: ["#3A4A57", "#1A252E"],
  },
  {
    id: "d4",
    kind: "pan",
    title: "PAN Card",
    issuer: "Income Tax Dept.",
    number: "ABC•••• 21F",
    expires: "No expiry",
    status: "review",
    colors: ["#5A6B78", "#34424D"],
  },
];

export const NOTIFICATIONS = [
  { id: "n1", kind: "checkin", title: "You're checked in at Marine Bay Grand", body: "Room 1208 is ready. Your digital key is active.", time: "2m", unread: true },
  { id: "n2", kind: "family", title: "Kiara's identity is verified", body: "She can now check in with you across all venues.", time: "1h", unread: true },
  { id: "n3", kind: "trip", title: "Celestia Wonderland tomorrow", body: "Fast-lane face entry opens at 10:00 AM.", time: "3h", unread: false },
  { id: "n4", kind: "security", title: "New sign-in on iPhone 16 Pro", body: "Mumbai, India · If this wasn't you, secure your account.", time: "Yesterday", unread: false },
  { id: "n5", kind: "doc", title: "PAN Card under review", body: "We'll notify you once verification completes.", time: "2d", unread: false },
];
