/* =====================================================================
   CUSTOMER PROFILE / SESSION  (front-end only)
   ---------------------------------------------------------------------
   A "profile" is just the customer logged in on this browser, identified
   by phone number. Their record lives in zayka_customers (see data.js);
   the active session is stored separately so we know who is logged in.
   ===================================================================== */

const CUSTOMER_SESSION_KEY = "zayka_current_customer";

/* Returns the phone of the logged-in customer, or null */
function getCurrentCustomerPhone() {
  return localStorage.getItem(CUSTOMER_SESSION_KEY);
}

/* Returns the full customer record, or null */
function getCurrentCustomer() {
  const phone = getCurrentCustomerPhone();
  if (!phone) return null;
  return getCustomers().find(c => c.phone === phone) || null;
}

function setCurrentCustomer(phone) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, phone);
}

function logoutCustomer() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.location.href = "index.html";
}

/* Update the navbar profile link based on login state.
   Pass the <a> element id (default "navProfile"). */
function renderProfileNav(linkId = "navProfile") {
  const link = document.getElementById(linkId);
  if (!link) return;
  const c = getCurrentCustomer();
  if (c) {
    link.innerHTML = `<i class="fa-solid fa-user"></i> ${c.name.split(" ")[0]}`;
    link.href = "profile.html";
  } else {
    link.innerHTML = `<i class="fa-solid fa-user"></i> Profile`;
    link.href = "profile.html";
  }
}

/* Orders belonging to the logged-in customer (newest first) */
function getMyOrders() {
  const phone = getCurrentCustomerPhone();
  if (!phone) return [];
  return getOrders().filter(o => o.phone === phone);
}
