const USER_ID = '123456789012345678901234'; // TODO: replace with real logged-in user later

async function loadMealPlan() {
  try {
    const planLookupResponse = await fetch(
      `/api/meal-plans?userId=${encodeURIComponent(USER_ID)}&status=draft`
    );
    const planLookupResult = await planLookupResponse.json();

    const rawData = planLookupResult.data;
    const basicMealPlan = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!basicMealPlan || !basicMealPlan._id) {
      renderMealPlan(null);
      return;
    }

    const populatedResponse = await fetch(
      `/api/meal-plans/${basicMealPlan._id}?includeMeals=true`
    );
    const populatedResult = await populatedResponse.json();

    const mealPlan = populatedResult.data || null;

    renderMealPlan(mealPlan);
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
                class="btn btn-outline-danger remove-meal-btn"
                type="button"
                data-plan-id="${mealPlan._id}"
                data-meal-id="${entry.mealId}"
              >
                Remove Meal
              </button>
              <button
                class="btn btn-outline-custom view-recipe-btn"
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

  setupRemoveMealButtons();
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

function setupRemoveMealButtons() {
  const buttons = document.querySelectorAll('.remove-meal-btn');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const planId = button.dataset.planId;
      const mealId = button.dataset.mealId;

      if (!planId || !mealId) {
        console.error('Missing planId or mealId for removal.');
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Removing...';

      try {
        const response = await fetch(`/api/meal-plans/${planId}/meals/${mealId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to remove meal. Status: ${response.status}`);
        }

        await loadMealPlan();
      } catch (error) {
        console.error('Error removing meal:', error);
        button.disabled = false;
        button.textContent = originalText;
        alert('Unable to remove meal. Please try again.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadMealPlan();
});