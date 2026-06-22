/* Order history (filtered to the logged-in customer when available) + live status popups */
document.getElementById("year").textContent = new Date().getFullYear();
renderProfileNav();

const historyBox = document.getElementById("history");

function fmtDate(iso) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status) {
  const cls = "status-" + status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge ${cls}">${status}</span>`;
}

function currentOrders() {
  // logged in -> only my orders; otherwise everything
  return getCurrentCustomer() ? getMyOrders() : getOrders();
}

function render() {
  const orders = currentOrders();
  if (orders.length === 0) {
    historyBox.innerHTML = `
      <p class="empty">No orders yet.</p>
      <p class="center"><a href="menu.html" class="btn">Order Now</a></p>`;
    return;
  }
  historyBox.innerHTML = orders.map(o => `
    <div class="record fade-up">
      <h3>Order #${o.id} — ${money(o.total)} ${statusBadge(o.status)}</h3>
      <p class="meta">${fmtDate(o.createdAt)}</p>
      <p><b>${o.name}</b> • ${o.phone}</p>
      <p>${o.address}</p>
      <p class="meta">💵 Payment: ${o.payment || "Cash on Delivery"}</p>
      <ul>${o.items.map(i => `<li>${i.name} × ${i.qty} = ${money(i.price * i.qty)}</li>`).join("")}</ul>
    </div>`).join("");
}

/* ---------- live status popup ---------- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerHTML = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 4500);
}

function snapshot() {
  const map = {};
  currentOrders().forEach(o => { map[o.id] = o.status; });
  return map;
}

let lastStatusMap = snapshot();
function checkChanges() {
  const current = snapshot();
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
  if (changed) render();
}

render();
setInterval(checkChanges, 2000);
window.addEventListener("storage", e => { if (e.key === DB_KEYS.orders) checkChanges(); });
