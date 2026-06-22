# 📘 Zayka Fast Food — Full Project Documentation

This document explains **how the whole project is wired together** — every HTML page,
the single CSS file, and every JavaScript file and function — plus **how to change
things** (menu, password, prices, colors, statuses, etc.).

The whole app is **pure HTML + CSS + JavaScript**. There is **no server, no database,
no framework**. All data lives in the browser's `localStorage` as JSON.

---

## 1. The big picture

```
                ┌─────────────────────────────────────────────┐
                │              HTML PAGES (the screens)         │
                │  index · menu · orders · profile · login ·    │
                │  dashboard                                    │
                └───────────────┬───────────────────────────────┘
                                │ each page loads <script> files
                                ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                        JAVASCRIPT (the brain)                        │
   │                                                                      │
   │  config.js   → settings + admin username/password                   │
   │  data.js     → THE database layer (read/write JSON in localStorage) │
   │  customer.js → customer profile / "who is logged in"                │
   │  auth.js     → admin login / logout / page protection              │
   │                                                                      │
   │  main.js · menu.js · orders.js · profile.js · dashboard.js          │
   │            → one "page controller" per screen                       │
   └───────────────────────────┬──────────────────────────────────────────┘
                                │ reads/writes
                                ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                  localStorage  (JSON, lives in the browser)          │
   │   zayka_restaurants · zayka_orders · zayka_customers ·               │
   │   zayka_current_customer (+ sessionStorage: zayka_admin_session)     │
   └────────────────────────────────────────────────────────────────────┘
```

**Golden rule:** No JS file talks to `localStorage` directly except `data.js`
(and the two tiny session helpers). Everything else calls functions like
`getOrders()` or `addOrder()`. This keeps storage in one place — change it once,
it changes everywhere.

### Script load order matters
Every page loads scripts **bottom-up in dependency order**, e.g. the menu page:

```html
<script src="js/config.js"></script>   <!-- 1. settings -->
<script src="js/data.js"></script>     <!-- 2. needs config -->
<script src="js/customer.js"></script> <!-- 3. needs data -->
<script src="js/menu.js"></script>     <!-- 4. the page logic, needs all above -->
```

If you ever add a new function, put its file **before** the page script that uses it.

---

## 2. The data layer — `js/data.js`  (the "database")

This file is the heart of the app. It stores everything as JSON.

### Storage keys
```js
const DB_KEYS = {
  restaurants: "zayka_restaurants", // restaurants + their menu items
  orders:      "zayka_orders",      // every order ever placed
  customers:   "zayka_customers"    // every customer
};
```

### Seed data
`SEED_RESTAURANTS` is the **default menu** used the very first time the app runs
(when `zayka_restaurants` doesn't exist yet). Edit this array to change the
starting menu — but note: once data is saved in the browser, the seed is ignored.
To re-seed, clear storage (see §10).

### Functions in `data.js`

| Function | What it does |
|----------|--------------|
| `readJSON(key, fallback)` | Reads a key from localStorage and `JSON.parse`s it. Returns `fallback` if missing/broken. |
| `writeJSON(key, value)` | `JSON.stringify`s a value and saves it. **The only "write to disk".** |
| `getRestaurants()` | Returns the restaurant/menu list. Seeds defaults on first run. |
| `saveRestaurants(list)` | Saves the whole restaurant list back. |
| `getOrders()` | Returns all orders (newest first). |
| `addOrder(order)` | Adds a new order to the **front** of the list (`unshift`). |
| `clearOrders()` | Empties the order list (used by admin "Clear All"). |
| `getCustomers()` | Returns all customer records. |
| `upsertCustomer(name, phone, address)` | **UP**date-or-in**SERT**. Finds a customer by phone; updates them and bumps `orderCount`, or creates a new one. Returns the record. |
| `nextId(list)` | Returns `max(id)+1` for a list — used to generate new IDs. |
| `money(amount)` | Formats a number as currency, e.g. `199` → `₹199` (uses `APP_CONFIG.currency`). |

> **Example — how an order is saved:** when you check out, `menu.js` builds an
> `order` object and calls `addOrder(order)`, which calls `writeJSON("zayka_orders", ...)`.
> That's the entire "save to database" path.

---

## 3. Settings + admin password — `js/config.js`

This is where you change app-wide settings and the **admin login**.

```js
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "muskann123"   // ← change this to reset the password
};

const APP_CONFIG = {
  restaurantName: "ZAYKA FAST FOOD",
  currency: "₹"            // ← change to "$", "€", etc.
};
```

- **Reset the admin password:** edit `password` here, save the file. Done — no build step.
- **Change the currency symbol:** edit `currency`; it flows everywhere through `money()`.

---

## 4. The login systems (there are two)

### A) Admin login — `js/auth.js`
Protects the dashboard. Uses **`sessionStorage`** (cleared when the tab closes).

| Function | What it does |
|----------|--------------|
| `login(username, password)` | Compares input to `ADMIN_CREDENTIALS`. On match, sets `sessionStorage["zayka_admin_session"]="true"` and returns `true`. |
| `isLoggedIn()` | Returns `true` if that session flag is set. |
| `logout()` | Clears the flag and redirects to `login.html`. |
| `requireAuth()` | **Page guard.** Called at the top of `dashboard.js`; if not logged in, it kicks you back to the login page. |

**Flow:** `login.html` form → `login(u, p)` → if true, go to `dashboard.html` →
`dashboard.js` runs `requireAuth()` to make sure you're allowed in.

> ⚠️ This is front-end-only auth. The password is in plain JS, fine for a
> college/portfolio demo, **not** real security.

### B) Customer profile — `js/customer.js`
A customer is "logged in" simply by having their **phone number** stored.
Uses **`localStorage`** (persists across visits).

| Function | What it does |
|----------|--------------|
| `getCurrentCustomerPhone()` | Returns the saved phone, or `null`. |
| `getCurrentCustomer()` | Returns the full customer record (looks it up in `getCustomers()`), or `null`. |
| `setCurrentCustomer(phone)` | Saves the phone as the active session: `localStorage.setItem("zayka_current_customer", phone)`. **← the function in your screenshot.** |
| `logoutCustomer()` | Removes the session key and returns to the home page. |
| `renderProfileNav(linkId)` | Updates the navbar "Profile" link to show the logged-in first name. |
| `getMyOrders()` | Returns only the orders whose `phone` matches the logged-in customer. |

**`setCurrentCustomer` explained (your screenshot):** it takes a `phone` string and
writes it under the key `CUSTOMER_SESSION_KEY` (`"zayka_current_customer"`). That single
stored value is how every page knows *who* is logged in. It's called in two places:
when you save a profile (`profile.js`) and when you check out (`menu.js`).

---

## 5. Page-by-page: HTML + its controller JS

Every page shares the **same navbar** and loads `css/style.css`. Each has a matching
JS "controller" that fills it with data.

### 🏠 `index.html` → `js/main.js`
The welcome screen + restaurant showcase.
- `startBtn.onclick` hides the welcome splash and shows the main page.
- Reads `getRestaurants()` and renders restaurant cards.
- Calls `renderProfileNav()` so the navbar greets a logged-in customer.

### 🍽️ `menu.html` → `js/menu.js`
Browse menu, build a cart, checkout. **Most important customer page.**

| Function | What it does |
|----------|--------------|
| `addToCart(id, name, price)` | Adds an item (or increments its quantity) in the in-memory `cart` object. |
| `changeQty(id, delta)` | `+`/`−` buttons. Removes the item if quantity hits 0. |
| `cartTotal()` | Sums `price × qty` for everything in the cart. |
| `renderCart()` | Redraws the cart UI and shows/hides the checkout box. |
| *(form submit)* | Builds the `order` object, calls `upsertCustomer()` + `setCurrentCustomer()` + `addOrder()`, then `showSuccess()`. |
| `showSuccess(order)` | Shows the celebration popup with the order summary + payment. |
| `launchConfetti()` | Spawns ~90 colored confetti `<div>`s that fall and auto-remove. |

It also **prefills** the checkout form from `getCurrentCustomer()` if you've ordered before.

### 📦 `orders.html` → `js/orders.js`
Order history (filtered to you if logged in, otherwise all orders).

| Function | What it does |
|----------|--------------|
| `statusBadge(status)` | Returns a colored pill for a status. |
| `currentOrders()` | `getMyOrders()` if logged in, else `getOrders()`. |
| `render()` | Draws every order card (date, items, payment, status). |
| `showToast(msg)` | Slides in the bottom popup. |
| `checkChanges()` | Compares each order's status to the last snapshot; if the admin changed one, fires a toast + re-renders. |

It **polls every 2 seconds** and also listens for cross-tab `storage` events, so status
changes from the admin appear live.

### 👤 `profile.html` → `js/profile.js`
Customer profile + live order tracking.

| Function | What it does |
|----------|--------------|
| *(form submit)* | Saves/updates the customer and calls `setCurrentCustomer()` to "log in". |
| `renderProfile()` | Shows avatar, name, contact, and splits orders into **Current** vs **Past**. |
| `statusTracker(status)` | Draws the visual stepper (Placed → Preparing → Out for delivery → Delivered). |
| `statusBadge`, `showToast`, `snapshotStatuses`, `checkForStatusChanges` | Same live-update mechanism as orders.js. |

### 🔐 `login.html` → uses `js/auth.js`
The admin login form. On submit it calls `login()` and, on success, redirects to the
dashboard. Shows a hint that the password is reset in `js/config.js`.

### 🛠️ `dashboard.html` → `js/dashboard.js`
The admin control panel. First line is `requireAuth()` — no login, no entry.

| Function | What it does |
|----------|--------------|
| `showTab(name, btn)` | Switches between the Restaurants / Orders / Customers panels. |
| `countUp(el, target, prefix)` | Animates a number counting up (the stat cards). |
| `isToday(iso)` | True if a date is today (for "Today's Earnings"). |
| `renderStats()` | Computes **Total Earnings, Today's Earnings, Total/Pending/Delivered orders, Avg Order Value, Customers, Restaurants**, and the **Best Seller**. Cancelled orders are excluded from money. |
| `renderRestaurants()` | Draws each restaurant with its menu + add/remove controls. |
| `addRestaurant()` / `deleteRestaurant(id)` | Add or remove a restaurant. |
| `addItem(restId)` / `deleteItem(restId, itemId)` | Add or remove a menu item (with price). |
| `renderOrders()` | Table of all orders with a **status dropdown** and payment column. |
| `updateOrderStatus(orderId, status)` | Saves a new status — this is what triggers the customer's live popup. |
| `adminClearOrders()` | Deletes all orders (with confirm). |
| `renderCustomers()` | Table of customers with order counts. |
| `refresh()` | Re-runs all the render functions. Called after every change. |

---

## 6. The styling — `css/style.css`

One file, loaded by every page. Organized top-to-bottom:

1. **Reset + base** (`*`, `body`) — fonts, the cream background.
2. **Welcome / navbar / hero** — the orange-red theme.
3. **Cards, menu items, buttons, forms** — reusable building blocks.
4. **Cart, order records, tables, admin layout** — feature-specific.
5. **Profile, badges, status tracker, toast** — the live-status visuals.
6. **Transitions + animations** — `fadeIn`, `fadeUp`, the bouncing arrow, hover lifts.
7. **Dashboard stats + success modal + confetti** — the celebration popup.
8. **`@media` queries** — responsive rules (hamburger menu, stacking) at 768px & 420px.

**Theme colors live here.** The brand color is `#e25822` / `orange` / `tomato`.
Search-and-replace those to re-skin the app.

---

## 7. The status flow (how live updates work end-to-end)

```
Admin changes a dropdown in dashboard.html
        │
        ▼
updateOrderStatus(id, status)  →  writeJSON("zayka_orders", ...)
        │
        ▼  (other tab/page polls every 2s OR gets a 'storage' event)
checkChanges() / checkForStatusChanges()
        │
        ▼
status differs from last snapshot?  → showToast("🛵 Order #… is now …")  + re-render tracker
```

Order statuses: **Placed → Preparing → Out for delivery → Delivered** (plus **Cancelled**).
Payment status: **Pending (COD)** for Cash on Delivery.

---

## 8. How to UPDATE common things

| I want to… | Do this |
|------------|---------|
| **Reset the admin password** | `js/config.js` → change `ADMIN_CREDENTIALS.password`. |
| **Change the admin username** | `js/config.js` → change `ADMIN_CREDENTIALS.username`. |
| **Add/remove restaurants or menu items** | Log in as admin → **Dashboard → Restaurants & Menu** (no code needed). |
| **Change the starting/default menu** | `js/data.js` → edit `SEED_RESTAURANTS` (then clear storage, §10). |
| **Change prices** | Dashboard (live) or `SEED_RESTAURANTS` for defaults. |
| **Change currency symbol** | `js/config.js` → `APP_CONFIG.currency`. |
| **Add a new order status** | Add it to the `<select>` options in `dashboard.js → renderOrders()` and to `STATUS_FLOW`/`steps` in `profile.js` if it should appear in the tracker. |
| **Add a new payment method** | `menu.html` → add an `<option>` to `#custPayment`. |
| **Change brand colors** | `css/style.css` → replace `#e25822`, `orange`, `tomato`. |
| **Change the site name/logo text** | The `.logo` div in each page's `<nav>` + `APP_CONFIG.restaurantName`. |
| **Add a brand-new page** | Copy an existing page, keep the navbar, load `config.js` + `data.js` (+ `customer.js`), then add your own controller JS **last**. |

---

## 9. Data shapes (what the JSON looks like)

**Restaurant**
```json
{ "id": 1, "name": "🍕 Pizza Hub",
  "items": [ { "id": 11, "name": "Cheese Pizza", "price": 199 } ] }
```

**Order**
```json
{ "id": 1718000000000, "customerId": 17180000,
  "name": "Asha", "phone": "9876543210", "address": "Pune",
  "payment": "Cash on Delivery", "paymentStatus": "Pending (COD)",
  "items": [ { "name": "Burger", "price": 99, "qty": 2 } ],
  "total": 198, "status": "Placed", "createdAt": "2026-06-22T..." }
```

**Customer**
```json
{ "id": 17180000, "name": "Asha", "phone": "9876543210",
  "address": "Pune", "orderCount": 3, "joinedAt": "2026-06-22T..." }
```

---

## 10. Running, resetting, and troubleshooting

- **Run it:** double-click `index.html`, or serve the folder
  (`python -m http.server 8099` → open `http://localhost:8099`).
- **Reset ALL data:** open DevTools (F12) → **Application → Local Storage** →
  delete the `zayka_*` keys (or "Clear site data"). Reload — defaults re-seed.
- **Admin can't log in:** check the exact `username`/`password` in `js/config.js`
  (it's case-sensitive).
- **Live status not updating:** the page polls every 2s; make sure you changed the
  status in the **admin dashboard** and that both tabs are the same site/origin.
- **Changes to `SEED_RESTAURANTS` don't show:** that only applies on first run —
  clear `zayka_restaurants` to re-seed.

---

## 11. File checklist

```
ZaykaFastFood/
├── index.html        Home / welcome            → js/main.js
├── menu.html         Menu + cart + checkout    → js/menu.js
├── orders.html       Order history             → js/orders.js
├── profile.html      Customer profile/tracking → js/profile.js
├── login.html        Admin login               → js/auth.js
├── dashboard.html    Admin dashboard           → js/dashboard.js
├── css/
│   └── style.css     All styling + animations
├── js/
│   ├── config.js     Settings + admin password
│   ├── data.js       JSON storage layer (the "database")
│   ├── customer.js   Customer profile/session
│   ├── auth.js       Admin login/logout/guard
│   ├── main.js       Home controller
│   ├── menu.js       Menu/cart/checkout controller
│   ├── orders.js     Order-history controller
│   ├── profile.js    Profile controller
│   └── dashboard.js  Admin controller
├── README.md         Quick start
└── DOCUMENTATION.md  ← this file
```
