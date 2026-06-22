/* Menu + cart + checkout */
document.getElementById("year").textContent = new Date().getFullYear();
renderProfileNav();

/* Prefill checkout if the customer already has a profile */
(function prefill() {
  const c = getCurrentCustomer();
  if (!c) return;
  document.getElementById("custName").value = c.name;
  document.getElementById("custPhone").value = c.phone;
  document.getElementById("custAddress").value = c.address;
})();

const restaurants = getRestaurants();
const menuCards = document.getElementById("menuCards");
const cartItemsBox = document.getElementById("cartItems");
const cartTotalBox = document.getElementById("cartTotal");
const checkoutBox = document.getElementById("checkoutBox");

/* cart = { itemId: {name, price, qty} } */
let cart = {};

/* Render menu with Add buttons */
menuCards.innerHTML = restaurants.map(r => `
  <div class="card">
    <h2>${r.name}</h2>
    ${r.items.map(i => `
      <div class="menu-item">
        <span>${i.name}<br><span class="price">${money(i.price)}</span></span>
        <button class="btn-sm btn-add"
          onclick="addToCart(${i.id}, '${i.name.replace(/'/g, "\\'")}', ${i.price})">
          Add
        </button>
      </div>`).join("")}
  </div>
`).join("");

function addToCart(id, name, price) {
  if (cart[id]) {
    cart[id].qty++;
  } else {
    cart[id] = { name, price, qty: 1 };
  }
  renderCart();
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
}

function cartTotal() {
  return Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCart() {
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    cartItemsBox.innerHTML = '<p class="empty">Your cart is empty. Add some items above 🍕</p>';
    cartTotalBox.textContent = "";
    checkoutBox.style.display = "none";
    return;
  }

  cartItemsBox.innerHTML = ids.map(id => {
    const i = cart[id];
    return `
      <div class="cart-row">
        <span>${i.name} <small>(${money(i.price)})</small></span>
        <span class="row-inline">
          <button class="btn-sm btn-grey" onclick="changeQty(${id}, -1)">−</button>
          <b>${i.qty}</b>
          <button class="btn-sm btn-add" onclick="changeQty(${id}, 1)">+</button>
          <b style="min-width:60px;text-align:right;">${money(i.price * i.qty)}</b>
        </span>
      </div>`;
  }).join("");

  cartTotalBox.textContent = "Total: " + money(cartTotal());
  checkoutBox.style.display = "block";
}

/* Checkout */
document.getElementById("orderForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (Object.keys(cart).length === 0) return;

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const payment = document.getElementById("custPayment").value;

  const customer = upsertCustomer(name, phone, address);
  setCurrentCustomer(phone); // remember this customer as the logged-in profile

  const order = {
    id: Date.now(),
    customerId: customer.id,
    name, phone, address,
    payment,
    paymentStatus: "Pending (COD)",
    items: Object.values(cart).map(i => ({ name: i.name, price: i.price, qty: i.qty })),
    total: cartTotal(),
    status: "Placed",
    createdAt: new Date().toISOString()
  };
  addOrder(order);

  showSuccess(order);

  cart = {};
  renderCart();
  // keep the customer's saved details prefilled; only reset shipping is not needed
});

/* ---------- celebratory success popup + confetti ---------- */
function showSuccess(order) {
  document.getElementById("successMsg").textContent =
    `Thank you, ${order.name.split(" ")[0]}! Your delicious food is on its way. 🛵`;
  document.getElementById("successDetails").innerHTML = `
    <div class="cart-row"><span>Order #</span><b>${order.id}</b></div>
    ${order.items.map(i => `<div class="cart-row"><span>${i.name} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}
    <div class="cart-row"><span>Payment</span><b>💵 ${order.payment}</b></div>
    <div class="cart-total">Total: ${money(order.total)}</div>`;
  const modal = document.getElementById("successModal");
  modal.classList.add("show");
  launchConfetti();
}

function launchConfetti() {
  const colors = ["#ff9800", "#ff5722", "#ffc107", "#e91e63", "#4caf50", "#2196f3"];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.6 + "s";
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    piece.style.width = piece.style.height = 6 + Math.random() * 8 + "px";
    if (Math.random() > 0.5) piece.style.borderRadius = "50%";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3600);
  }
}
