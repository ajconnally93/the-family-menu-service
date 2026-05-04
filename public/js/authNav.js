function renderAuthNav() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const USER_ID = currentUser?._id;

  const authSection = document.getElementById('auth-section');
  const mealPlanLink = document.getElementById('meal-plan-link');
  const groceryListLink = document.getElementById('grocery-list-link');

  if (!authSection) return;

  if (USER_ID) {
    authSection.innerHTML = `
      <button class="btn btn-outline-custom btn-sm" id="logout-button" type="button">
        Logout
      </button>
    `;
  } else {
    authSection.innerHTML = `
      <a class="btn btn-outline-custom btn-sm" href="/login.html">Login</a>
      <a class="btn btn-primary btn-sm" href="/register.html">Register</a>
    `;
  }

  if (!USER_ID) {
    if (mealPlanLink) {
      mealPlanLink.setAttribute('title', 'Log in to access your meal plan');
    }

    if (groceryListLink) {
      groceryListLink.setAttribute('title', 'Log in to access your grocery list');
    }

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });
  }
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', renderAuthNav);

document.addEventListener('click', (event) => {
  const logoutButton = event.target.closest('#logout-button');

  if (logoutButton) {
    logoutUser();
  }
});