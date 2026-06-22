/* Admin dashboard logic */
requireAuth();

function fmtDate(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/* ---------------- Tabs ---------------- */
function showTab(name, btn) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  btn.classList.add("active");
}

/* ---------------- Stats ---------------- */
/* Animated count-up; prefix (e.g. ₹) is kept in front */
function countUp(el, target, prefix = "") {
  const start = parseFloat((el.dataset.val || "0")) || 0;
  el.dataset.val = target;
  const duration = 600, t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = Math.round(start + (target - start) * eased);
    el.textContent = prefix + val.toLocaleString("en-IN");
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function isToday(iso) {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function renderStats() {
  const orders = getOrders();
  const earning = orders.filter(o => o.status !== "Cancelled");           // money only from non-cancelled
  const revenue = earning.reduce((s, o) => s + o.total, 0);
  const today = earning.filter(o => isToday(o.createdAt)).reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const avg = earning.length ? Math.round(revenue / earning.length) : 0;

  const C = APP_CONFIG.currency;
  countUp(document.getElementById("statEarnings"), revenue, C);
  countUp(document.getElementById("statToday"), today, C);
  countUp(document.getElementById("statOrders"), orders.length);
  countUp(document.getElementById("statPending"), pending);
  countUp(document.getElementById("statDelivered"), delivered);
  countUp(document.getElementById("statAvg"), avg, C);
  countUp(document.getElementById("statCustomers"), getCustomers().length);
  countUp(document.getElementById("statRestaurants"), getRestaurants().length);

  // best-selling item by quantity
  const tally = {};
  earning.forEach(o => o.items.forEach(i => { tally[i.name] = (tally[i.name] || 0) + i.qty; }));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("bestSeller").innerHTML = top
    ? `🏆 <b>Best Seller:</b> ${top[0]} — ${top[1]} sold`
    : "";
}

/* ---------------- Restaurants & Menu ---------------- */
function renderRestaurants() {
  const list = getRestaurants();
  const box = document.getElementById("restaurantList");

  box.innerHTML = list.map(r => `
    <div class="admin-restaurant">
      <h3>
        <span>${r.name}</span>
        <button class="btn-danger btn-sm" onclick="deleteRestaurant(${r.id})">Delete Restaurant</button>
      </h3>
      <table>
        <tr><th>Item</th><th>Price</th><th></th></tr>
        ${r.items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${money(i.price)}</td>
            <td><button class="btn-danger btn-sm" onclick="deleteItem(${r.id}, ${i.id})">Remove</button></td>
          </tr>`).join("")}
      </table>
      <div class="row-inline" style="margin-top:12px;">
        <input type="text" id="item-name-${r.id}" placeholder="New item name">
        <input type="number" id="item-price-${r.id}" placeholder="Price" min="1">
        <button class="btn-add btn-sm" onclick="addItem(${r.id})">Add Item</button>
      </div>
    </div>
  `).join("");
}

function addRestaurant() {
  const input = document.getElementById("newRestName");
  const name = input.value.trim();
  if (!name) { alert("Enter a restaurant name."); return; }
  const list = getRestaurants();
  list.push({ id: nextId(list), name, items: [] });
  saveRestaurants(list);
  input.value = "";
  refresh();
}

function deleteRestaurant(id) {
  if (!confirm("Delete this restaurant and all its items?")) return;
  saveRestaurants(getRestaurants().filter(r => r.id !== id));
  refresh();
}

function addItem(restId) {
  const name = document.getElementById("item-name-" + restId).value.trim();
  const price = parseFloat(document.getElementById("item-price-" + restId).value);
  if (!name || !(price > 0)) { alert("Enter a valid item name and price."); return; }
  const list = getRestaurants();
  const r = list.find(x => x.id === restId);
  const allItemIds = list.flatMap(x => x.items.map(i => i.id));
  const newItemId = allItemIds.length ? Math.max(...allItemIds) + 1 : 1;
  r.items.push({ id: newItemId, name, price });
  saveRestaurants(list);
  refresh();
}

function deleteItem(restId, itemId) {
  const list = getRestaurants();
  const r = list.find(x => x.id === restId);
  r.items = r.items.filter(i => i.id !== itemId);
  saveRestaurants(list);
  refresh();
}

/* ---------------- Orders ---------------- */
function renderOrders() {
  const orders = getOrders();
  const box = document.getElementById("ordersTable");
  if (orders.length === 0) { box.innerHTML = '<p class="empty">No orders yet.</p>'; return; }

  box.innerHTML = `
    <table>
      <tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
      ${orders.map(o => `
        <tr>
          <td>${o.id}</td>
          <td>${fmtDate(o.createdAt)}</td>
          <td>${o.name}<br><small>${o.phone}</small></td>
          <td>${o.items.map(i => `${i.name} ×${i.qty}`).join("<br>")}</td>
          <td>${money(o.total)}</td>
          <td>💵 ${o.payment || "Cash on Delivery"}<br><small>${o.paymentStatus || "Pending (COD)"}</small></td>
          <td>
            <select onchange="updateOrderStatus(${o.id}, this.value)">
              ${["Placed", "Preparing", "Out for delivery", "Delivered", "Cancelled"]
                .map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
        </tr>`).join("")}
    </table>`;
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (o) { o.status = status; writeJSON(DB_KEYS.orders, orders); }
}

function adminClearOrders() {
  if (!confirm("Delete ALL orders? This cannot be undone.")) return;
  clearOrders();
  refresh();
}

/* ---------------- Customers ---------------- */
function renderCustomers() {
  const customers = getCustomers();
  const box = document.getElementById("customersTable");
  if (customers.length === 0) { box.innerHTML = '<p class="empty">No customers yet.</p>'; return; }

  box.innerHTML = `
    <table>
      <tr><th>Name</th><th>Phone</th><th>Address</th><th>Orders</th><th>Joined</th></tr>
      ${customers.map(c => `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.address}</td>
          <td>${c.orderCount}</td>
          <td>${fmtDate(c.joinedAt)}</td>
        </tr>`).join("")}
    </table>`;
}

/* ---------------- Refresh all ---------------- */
function refresh() {
  renderStats();
  renderRestaurants();
  renderOrders();
  renderCustomers();
}

refresh();
