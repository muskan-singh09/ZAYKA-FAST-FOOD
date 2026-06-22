/* Customer profile page: login/register, my orders, live status popups */
document.getElementById("year").textContent = new Date().getFullYear();
renderProfileNav();

const STATUS_FLOW = ["Placed", "Preparing", "Out for delivery", "Delivered", "Cancelled"];

function fmtDate(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status) {
  const cls = "status-" + status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge ${cls}">${status}</span>`;
}

/* Visual step tracker for an active order */
function statusTracker(status) {
  if (status === "Cancelled") return `<p class="error">❌ This order was cancelled.</p>`;
  const steps = ["Placed", "Preparing", "Out for delivery", "Delivered"];
  const idx = steps.indexOf(status);
  return `<div class="tracker">${steps.map((s, i) => `
    <div class="step ${i <= idx ? "done" : ""}">
      <span class="dot">${i <= idx ? "✓" : i + 1}</span>
      <small>${s}</small>
    </div>`).join("")}</div>`;
}

/* ---------- toast ---------- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerHTML = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 4500);
}

/* ---------- login / register ---------- */
const loginCard = document.getElementById("loginCard");
const profileView = document.getElementById("profileView");

document.getElementById("profileForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("pName").value.trim();
  const phone = document.getElementById("pPhone").value.trim();
  const address = document.getElementById("pAddress").value.trim();
  // upsert without bumping order count (only orders bump it) — re-save details
  const customers = getCustomers();
  let c = customers.find(x => x.phone === phone);
  if (c) { c.name = name; c.address = address; }
  else {
    c = { id: Date.now(), name, phone, address, orderCount: 0, joinedAt: new Date().toISOString() };
    customers.push(c);
  }
  writeJSON(DB_KEYS.customers, customers);
  setCurrentCustomer(phone);
  renderProfile();
});

/* ---------- render profile + orders ---------- */
let lastStatusMap = {}; // orderId -> status, for change detection

function renderProfile() {
  const c = getCurrentCustomer();
  if (!c) { loginCard.style.display = "block"; profileView.style.display = "none"; return; }

  loginCard.style.display = "none";
  profileView.style.display = "block";
  renderProfileNav();

  document.getElementById("pAvatar").textContent = c.name.charAt(0).toUpperCase();
  document.getElementById("pvName").textContent = c.name;
  document.getElementById("pvContact").textContent = `${c.phone} • ${c.address}`;

  const orders = getMyOrders();
  const active = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
  const past = orders.filter(o => o.status === "Delivered" || o.status === "Cancelled");

  const activeBox = document.getElementById("activeOrders");
  const pastBox = document.getElementById("pastOrders");

  activeBox.innerHTML = active.length ? active.map(o => `
    <div class="record fade-up">
      <h3>Order #${o.id} — ${money(o.total)} ${statusBadge(o.status)}</h3>
      <p class="meta">${fmtDate(o.createdAt)} • 💵 ${o.payment || "Cash on Delivery"}</p>
      ${statusTracker(o.status)}
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join("")}</ul>
    </div>`).join("") : '<p class="empty">No active orders right now.</p>';

  pastBox.innerHTML = past.length ? past.map(o => `
    <div class="record fade-up">
      <h3>Order #${o.id} — ${money(o.total)} ${statusBadge(o.status)}</h3>
      <p class="meta">${fmtDate(o.createdAt)} • 💵 ${o.payment || "Cash on Delivery"}</p>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty}</li>`).join("")}</ul>
    </div>`).join("") : '<p class="empty">No past orders yet.</p>';
}

/* ---------- live status polling ---------- */
function snapshotStatuses() {
  const map = {};
  getMyOrders().forEach(o => { map[o.id] = o.status; });
  return map;
}

function checkForStatusChanges() {
  const current = snapshotStatuses();
  let changed = false;
  for (const id in current) {
    if (lastStatusMap[id] && lastStatusMap[id] !== current[id]) {
      changed = true;
      const emoji = current[id] === "Delivered" ? "🎉"
                  : current[id] === "Cancelled" ? "❌"
                  : current[id] === "Out for delivery" ? "🛵" : "👩‍🍳";
      showToast(`${emoji} Order #${id} is now <b>${current[id]}</b>`);
    }
  }
  lastStatusMap = current;
  if (changed) renderProfile();
}

/* init */
if (getCurrentCustomer()) renderProfile();
lastStatusMap = snapshotStatuses();

// poll for same-tab admin updates, and listen for cross-tab changes
setInterval(checkForStatusChanges, 2000);
window.addEventListener("storage", function (e) {
  if (e.key === DB_KEYS.orders) checkForStatusChanges();
});
