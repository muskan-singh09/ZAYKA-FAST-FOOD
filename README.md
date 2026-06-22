# Zayka Fast Food 🍔

A food-delivery web app built with **only HTML, CSS and JavaScript** — no frameworks,
no backend, no database. All data is stored as **JSON in the browser** (localStorage).

## How to run
Just double-click **`index.html`** (or open it in any browser). That's it.

## Pages
| Page | File | What it does |
|------|------|--------------|
| Home | `index.html` | Welcome screen + restaurant showcase |
| Menu | `menu.html` | Browse menu, add to cart, checkout |
| Order History | `orders.html` | All placed orders |
| Admin Login | `login.html` | Login to the dashboard |
| Admin Dashboard | `dashboard.html` | Manage restaurants/menu, orders, customers |

## Admin login
Default credentials:

```
Username: admin
Password: muskann123
```

### Reset the password from code
Open **`js/config.js`** and edit `ADMIN_CREDENTIALS`:

```js
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "your-new-password"
};
```

Save the file — the new password works immediately. No build step needed.

## Where is the data stored?
Everything is JSON in the browser's `localStorage`:

| Key | Contents |
|-----|----------|
| `zayka_restaurants` | Restaurants + menu items |
| `zayka_orders` | Order history |
| `zayka_customers` | Customer records |

To reset all data, clear the site's storage in your browser
(DevTools → Application → Local Storage) or just edit the defaults in `js/data.js`.

## Admin features
- Add / delete restaurants
- Add / remove menu items with prices
- View all orders and change their status (Placed → Preparing → Delivered …)
- View customer list with order counts
- Live stats: total orders, revenue, customers, restaurants

> ⚠️ This is a front-end-only demo. The admin password lives in plain JavaScript,
> so it is meant for learning/portfolio use, not real-world security.
