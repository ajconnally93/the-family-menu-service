const USER_ID = '123456789012345678901234'; // TODO: replace with real logged-in user later

async function loadMealPlan() {
  try {
    const response = await fetch(`/api/meal-plans?userId=${encodeURIComponent(USER_ID)}&status=draft`);
    const result = await response.json();

    // Handles either:
    // 1) an array response: { data: [ ...plans ] }
    // 2) a single object response: { data: { ...plan } }
    const rawData = result.data;
    const mealPlan = Array.isArray(rawData) ? rawData[0] : rawData;

    renderMealPlan(mealPlan || null);
  } catch (error) {
    console.error('Error loading meal plan:', error);
    renderErrorState();
  }
}

function renderMealPlan(mealPlan) {
  const container = document.getElementById('mealPlanContainer');
  const totalCostElement = document.getElementById('planTotalCost');

  container.innerHTML = '';

  if (!mealPlan || !mealPlan.meals || !mealPlan.meals.length) {
    totalCostElement.textContent = '$0.00';

    container.innerHTML = `
      <div class="col-12">
        <div class="meal-card">
          <div class="meal-body">
            <div class="meal-content">
              <h3>No meals in your plan yet.</h3>
              <p>Add meals from the Meal Library to start building your weekly plan.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const formattedTotal =
    typeof mealPlan.estimatedTotalCost === 'number'
      ? `$${mealPlan.estimatedTotalCost.toFixed(2)}`
      : '$0.00';

  totalCostElement.textContent = formattedTotal;

  mealPlan.meals.forEach((entry) => {
    const meal = entry.meal || {};

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const tagsHtml = (meal.tags || [])
      .map((tag) => `<span class="chip">${tag}</span>`)
      .join('');

    const formattedMealCost =
      typeof meal.estimatedMealCost === 'number'
        ? meal.estimatedMealCost.toFixed(2)
        : '0.00';

    col.innerHTML = `
      <div class="meal-card h-100">
        <div class="meal-img">Meal Image</div>
        <div class="meal-body">
          <div class="meal-content">
            <h3>${meal.title || 'Untitled Meal'}</h3>
            <p>${meal.description || 'No description available.'}</p>
          </div>

          <div class="meal-footer">
            <p class="price">Estimated cost: $${formattedMealCost}</p>
            <div class="meal-tags">
              ${tagsHtml}
            </div>
            <div class="meal-actions">
              <button
                class="btn btn-outline-danger"
                type="button"
                data-plan-id="${mealPlan._id}"
                data-meal-id="${entry.mealId}"
              >
                Remove Meal
              </button>
              <button
                class="btn btn-outline-custom"
                type="button"
                data-meal-id="${entry.mealId}"
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
}

function renderErrorState() {
  const container = document.getElementById('mealPlanContainer');
  const totalCostElement = document.getElementById('planTotalCost');

  totalCostElement.textContent = '$0.00';

  container.innerHTML = `
    <div class="col-12">
      <div class="meal-card">
        <div class="meal-body">
          <div class="meal-content">
            <h3>Unable to load your meal plan.</h3>
            <p>Please try again in a moment.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadMealPlan();
});