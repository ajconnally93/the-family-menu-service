const form = document.getElementById('registerForm');
const errorBox = document.getElementById('registerError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorBox.classList.add('d-none');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !password) {
    errorBox.textContent = 'All fields are required.';
    errorBox.classList.remove('d-none');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Registration failed');
    }

    localStorage.setItem('currentUser', JSON.stringify(result.data));

    window.location.href = '/my-meal-plan.html';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('d-none');
  }
});