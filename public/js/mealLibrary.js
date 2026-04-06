async function loadMeals(tag = '') {
  try {
    const url = tag ? `/api/meals?tag=${encodeURIComponent(tag)}` : '/api/meals';
    const response = await fetch(url);
    const result = await response.json();

    renderMeals(result.data || []);
  } catch (error) {
    console.error('Error loading meals:', error);
    renderErrorState();
  }
}

function renderMeals(meals) {
  const container = document.getElementById('mealContainer');
  container.innerHTML = '';

  if (!meals.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="meal-card">
          <div class="meal-body">
            <div class="meal-content">
              <h3>No meals found.</h3>
              <p>Try selecting a different category or view all meals.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  meals.forEach((meal) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const tagsHtml = (meal.tags || [])
      .map((tag) => `<span class="chip">${tag}</span>`)
      .join('');

    const formattedCost =
      typeof meal.estimatedMealCost === 'number'
        ? meal.estimatedMealCost.toFixed(2)
        : meal.estimatedMealCost;

    col.innerHTML = `
      <div class="meal-card h-100">
        <div class="meal-img">Meal Image</div>
        <div class="meal-body">
          <div class="meal-content">
            <h3>${meal.title}</h3>
            <p>${meal.description}</p>
          </div>

          <div class="meal-footer">
            <p class="price">Estimated cost: $${formattedCost}</p>
            <div class="meal-tags">
              ${tagsHtml}
            </div>
            <div class="meal-actions">
              <button class="btn btn-primary" type="button">Add to Meal Plan</button>
              <button class="btn btn-outline-custom" type="button">View Recipe</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(col);
  });
}

function renderErrorState() {
  const container = document.getElementById('mealContainer');
  container.innerHTML = `
    <div class="col-12">
      <div class="meal-card">
        <div class="meal-body">
          <div class="meal-content">
            <h3>Unable to load meals.</h3>
            <p>Please try again in a moment.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupTagFilters() {
  const chips = document.querySelectorAll('[data-tag]');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const selectedTag = chip.dataset.tag;
      loadMeals(selectedTag);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupTagFilters();
  loadMeals();
});