/* Home page */
const startBtn = document.getElementById("startBtn");
const welcome = document.getElementById("welcome");
const mainPage = document.getElementById("mainPage");

startBtn.onclick = function () {
  welcome.style.display = "none";
  mainPage.style.display = "block";
};

document.getElementById("year").textContent = new Date().getFullYear();
renderProfileNav();

/* Render restaurant cards from stored data */
const cardsBox = document.getElementById("restaurantCards");
const restaurants = getRestaurants();

cardsBox.innerHTML = restaurants.map(r => `
  <div class="card">
    <h2>${r.name}</h2>
    ${r.items.map(i => `
      <div class="menu-item">
        <span>${i.name}</span>
        <span class="price">${money(i.price)}</span>
      </div>`).join("")}
  </div>
`).join("");
