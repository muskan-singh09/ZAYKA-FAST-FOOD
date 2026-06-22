/* =====================================================================
   DATA LAYER  —  stores everything as JSON in the browser (localStorage)
   ---------------------------------------------------------------------
   - Restaurants & menu  -> editable from the Admin Dashboard
   - Customers           -> saved automatically when an order is placed
   - Orders (history)    -> saved on every order
   Pure JSON. No backend.
   ===================================================================== */

const DB_KEYS = {
  restaurants: "zayka_restaurants",
  orders: "zayka_orders",
  customers: "zayka_customers"
};

/* Default seed data — used the first time the app runs */
const SEED_RESTAURANTS = [
  {
    id: 1,
    name: "🍕 Pizza Hub",
    items: [
      { id: 11, name: "Cheese Pizza", price: 199 },
      { id: 12, name: "Burger", price: 99 }
    ]
  },
  {
    id: 2,
    name: "🍗 Chicken Point",
    items: [
      { id: 21, name: "Chicken Roll", price: 149 },
      { id: 22, name: "Chicken Biryani", price: 249 }
    ]
  },
  {
    id: 3,
    name: "🍟 Fast Food Corner",
    items: [
      { id: 31, name: "French Fries", price: 89 },
      { id: 32, name: "Cold Drink", price: 49 }
    ]
  }
];

/* ---------- generic helpers ---------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- restaurants / menu ---------- */
function getRestaurants() {
  let data = readJSON(DB_KEYS.restaurants, null);
  if (!data) {
    data = SEED_RESTAURANTS;
    writeJSON(DB_KEYS.restaurants, data);
  }
  return data;
}

function saveRestaurants(list) {
  writeJSON(DB_KEYS.restaurants, list);
}

/* ---------- orders ---------- */
function getOrders() {
  return readJSON(DB_KEYS.orders, []);
}

function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // newest first
  writeJSON(DB_KEYS.orders, orders);
}

function clearOrders() {
  writeJSON(DB_KEYS.orders, []);
}

/* ---------- customers ---------- */
function getCustomers() {
  return readJSON(DB_KEYS.customers, []);
}

/* Save (or update) a customer keyed by phone, return the customer record */
function upsertCustomer(name, phone, address) {
  const customers = getCustomers();
  let existing = customers.find(c => c.phone === phone);
  if (existing) {
    existing.name = name;
    existing.address = address;
    existing.orderCount = (existing.orderCount || 0) + 1;
  } else {
    existing = {
      id: Date.now(),
      name: name,
      phone: phone,
      address: address,
      orderCount: 1,
      joinedAt: new Date().toISOString()
    };
    customers.push(existing);
  }
  writeJSON(DB_KEYS.customers, customers);
  return existing;
}

/* ---------- utility ---------- */
function nextId(list) {
  return list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
}

function money(amount) {
  return APP_CONFIG.currency + Number(amount).toLocaleString("en-IN");
}
