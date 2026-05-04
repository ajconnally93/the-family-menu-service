const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const USER_ID = currentUser?._id;

async function loadMealPlan() {
  try {
    if (!USER_ID) {
      window.location.href = '/login.html';
      return;
    }

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
    col.className = 'col-md-6 col-lg-3';

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
                data-title="${meal.title || 'Untitled Meal'}"
                data-cost="${typeof meal.estimatedMealCost === 'number' ? meal.estimatedMealCost.toFixed(2) : '0.00'}"
                data-description="${meal.description || 'No description available.'}"
                data-ingredients='${JSON.stringify(meal.ingredients || [])}'
                data-instructions='${JSON.stringify(meal.instructions || [])}'
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
  setupViewRecipeButtons();
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

function setupViewRecipeButtons() {
  const buttons = document.querySelectorAll('.view-recipe-btn');
  const modalElement = document.getElementById('recipeModal');

  if (!modalElement) {
    return;
  }

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
      } catch (error) {
        ingredients = [];
      }

      try {
        instructions = JSON.parse(button.dataset.instructions || '[]');
      } catch (error) {
        instructions = [];
      }

      populateRecipeModal({
        title,
        cost,
        description,
        ingredients,
        instructions
      });

      recipeModal.show();
    });
  });
}

function populateRecipeModal({ title, cost, description, ingredients, instructions }) {
  const titleElement = document.getElementById('recipeModalTitle');
  const costElement = document.getElementById('recipeModalCost');
  const descriptionElement = document.getElementById('recipeModalDescription');
  const ingredientsElement = document.getElementById('recipeModalIngredients');
  const instructionsElement = document.getElementById('recipeModalInstructions');

  titleElement.textContent = title;
  costElement.textContent = `$${cost}`;
  descriptionElement.textContent = description;

  ingredientsElement.innerHTML = '';
  instructionsElement.innerHTML = '';

  if (ingredients.length) {
    ingredients.forEach((ingredient) => {
      const li = document.createElement('li');

      const quantity = ingredient.quantity ?? '';
      const unit = ingredient.unit ?? '';
      const name = ingredient.name ?? 'Unnamed ingredient';

      li.textContent = `${quantity} ${unit} ${name}`.replace(/\s+/g, ' ').trim();
      ingredientsElement.appendChild(li);
    });
  } else {
    ingredientsElement.innerHTML = '<li>No ingredients available.</li>';
  }

  if (instructions.length) {
    instructions.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      instructionsElement.appendChild(li);
    });
  } else {
    instructionsElement.innerHTML = '<li>No instructions available.</li>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMealPlan();
});