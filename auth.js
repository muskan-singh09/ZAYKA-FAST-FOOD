/* Simple session-based admin auth (front-end only) */
const SESSION_KEY = "zayka_admin_session";

function login(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem(SESSION_KEY, "true");
    return true;
  }
  return false;
}

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

/* Call at the top of protected pages */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}
