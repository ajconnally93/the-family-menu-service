const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const USER_ID = currentUser?._id;

let currentSearch = '';
let currentTag = '';

async function loadMeals() {
  try {
    const params = new URLSearchParams();

    if (currentTag) {
      params.append('tag', currentTag);
    }

    if (currentSearch) {
      params.append('search', currentSearch);
    }

    const url = `/api/meals?${params.toString()}`;
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to load meals.');
    }

    renderMeals(result.data || []);
  } catch (error) {
    console.error('Error loading meals:', error);
    renderErrorState();
  }
}

function formatCookTime(minutes) {
  if (minutes === undefined || minutes === null) {
    return '';
  }

  const totalMinutes = Number(minutes);

  if (Number.isNaN(totalMinutes)) {
    return '';
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours && remainingMinutes) {
    return `${hours} hr ${remainingMinutes} mins`;
  }

  if (hours) {
    return `${hours} hr`;
  }

  return `${remainingMinutes} mins`;
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
              <p>Try selecting a different tag or search.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  meals.forEach((meal) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3';

    const formattedCost =
      typeof meal.estimatedMealCost === 'number'
        ? meal.estimatedMealCost.toFixed(2)
        : meal.estimatedMealCost || '0.00';

    const formattedCookTime = formatCookTime(meal.cookTimeMinutes);

    col.innerHTML = `
      <div class="meal-card h-100">
        <div class="meal-img">Meal Image</div>
        <div class="meal-body">
          <div class="meal-content">
            <h3 class="mb-1">${meal.title || 'Untitled Meal'}</h3>

            <div class="meal-meta mb-3">
              ${formattedCookTime ? `<p class="meal-time mb-1">${formattedCookTime}</p>` : ''}
              <p class="price mb-0">Estimated cost: $${formattedCost}</p>
            </div>

            <p class="meal-description mb-2" data-full="${escapeHtml(meal.description || '')}">
              ${meal.description || 'No description available.'}
            </p>

            <button class="read-more-btn btn btn-link p-0">
              Read more
            </button>
          </div>

          <div class="meal-footer">
            <div class="meal-actions">
              <button 
                class="btn btn-primary add-to-plan-btn"
                type="button"
                data-meal-id="${meal._id}"
              >
                Add to Meal Plan
              </button>

              <button
                class="btn btn-outline-custom view-recipe-btn"
                type="button"
                data-title="${escapeHtml(meal.title || 'Untitled Meal')}"
                data-cost="${formattedCost}"
                data-description="${escapeHtml(meal.description || 'No description available.')}"
                data-ingredients="${escapeHtml(JSON.stringify(meal.ingredients || []))}"
                data-instructions="${escapeHtml(JSON.stringify(meal.instructions || []))}"
              >
                View Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(col);
  });

  setupAddToPlanButtons();
  setupViewRecipeButtons();
  setupReadMore();
}

function setupReadMore() {
  const buttons = document.querySelectorAll('.read-more-btn');

  buttons.forEach((btn) => {
    const description = btn.previousElementSibling;

    if (description.scrollHeight <= description.clientHeight) {
      btn.style.display = 'none';
      return;
    }

    btn.addEventListener('click', () => {
      const isExpanded = description.classList.contains('expanded');

      description.classList.toggle('expanded');
      btn.textContent = isExpanded ? 'Read more' : 'Show less';
    });
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

      currentTag = chip.dataset.tag || '';
      loadMeals();
    });
  });
}

function setupSearch() {
  const input = document.getElementById('mealSearchInput');

  if (!input) return;

  input.addEventListener('input', () => {
    currentSearch = input.value.trim();
    loadMeals();
  });
}

function setupAddToPlanButtons() {
  const buttons = document.querySelectorAll('.add-to-plan-btn');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const mealId = button.dataset.mealId;

      if (!USER_ID) {
        window.location.href = '/login.html';
        return;
      }

      if (!mealId) {
        console.error('Missing mealId');
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Adding...';

      try {
        let mealPlan = null;

        const planResponse = await fetch(
          `/api/meal-plans?userId=${encodeURIComponent(USER_ID)}&status=draft`
        );
        const planResult = await planResponse.json();

        const rawData = planResult.data;
        mealPlan = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!mealPlan || !mealPlan._id) {
          const createPlanResponse = await fetch('/api/meal-plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: USER_ID
            })
          });

          const createPlanResult = await createPlanResponse.json();

          if (!createPlanResponse.ok) {
            throw new Error(createPlanResult.error?.message || 'Failed to create draft meal plan.');
          }

          mealPlan = createPlanResult.data;
        }

        const response = await fetch(`/api/meal-plans/${mealPlan._id}/meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mealId: mealId
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || `Failed to add meal.`);
        }

        button.textContent = 'Added!';

        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 1000);
      } catch (error) {
        console.error('Error adding meal:', error);
        button.textContent = originalText;
        button.disabled = false;
        alert(error.message || 'Unable to add meal.');
      }
    });
  });
}

function setupViewRecipeButtons() {
  const buttons = document.querySelectorAll('.view-recipe-btn');
  const modalElement = document.getElementById('recipeModal');

  if (!modalElement) return;

  const recipeModal = new bootstrap.Modal(modalElement);

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const title = button.dataset.title || 'Untitled Meal';
      const cost = button.dataset.cost || '0.00';
      const description = button.dataset.description || 'No description available.';

      let ingredients = [];
      let instructions = [];

      try {
        ingredients = JSON.parse(button.dataset.ingredients || '[]');
        instructions = JSON.parse(button.dataset.instructions || '[]');
      } catch {}

      populateRecipeModal({ title, cost, description, ingredients, instructions });
      recipeModal.show();
    });
  });
}

function populateRecipeModal({ title, cost, description, ingredients, instructions }) {
  document.getElementById('recipeModalTitle').textContent = title;
  document.getElementById('recipeModalCost').textContent = `$${cost}`;
  document.getElementById('recipeModalDescription').textContent = description;

  const ingredientsElement = document.getElementById('recipeModalIngredients');
  const instructionsElement = document.getElementById('recipeModalInstructions');

  ingredientsElement.innerHTML = '';
  instructionsElement.innerHTML = '';

  ingredients.length
    ? ingredients.forEach(i => {
        const li = document.createElement('li');
        li.textContent = `${i.quantity ?? ''} ${i.unit ?? ''} ${i.name ?? ''}`.trim();
        ingredientsElement.appendChild(li);
      })
    : ingredientsElement.innerHTML = '<li>No ingredients available.</li>';

  instructions.length
    ? instructions.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        instructionsElement.appendChild(li);
      })
    : instructionsElement.innerHTML = '<li>No instructions available.</li>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
  setupTagFilters();
  setupSearch();
  loadMeals();
});