const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  loginError.classList.add('d-none');
  loginError.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    loginError.textContent = 'Email and password are required.';
    loginError.classList.remove('d-none');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Login failed.');
    }

    localStorage.setItem('currentUser', JSON.stringify(result.data));

    window.location.href = '/my-meal-plan.html';
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('d-none');
  }
});