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

        // using meal._id since it's working with raw JS data, Mongoose populates using _id even though it's refactored to .mealId based on the Design doc
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

  setupAddToPlanButtons();
  setupViewRecipeButtons();
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

function setupAddToPlanButtons() {
  const buttons = document.querySelectorAll('.add-to-plan-btn');

  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const mealId = button.dataset.mealId;

      if (!mealId) {
        console.error('Missing mealId');
        return;
      }

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Adding...';

      try {
        const planResponse = await fetch(`/api/meal-plans?userId=${encodeURIComponent('123456789012345678901234')}&status=draft`);
        const planResult = await planResponse.json();

        const rawData = planResult.data;
        const mealPlan = Array.isArray(rawData) ? rawData[0] : rawData;

        if (!mealPlan || !mealPlan._id) {
          throw new Error('No draft meal plan found.');
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

        if (!response.ok) {
          throw new Error(`Failed to add meal. Status: ${response.status}`);
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
        alert('Unable to add meal. Please try again.');
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
  setupTagFilters();
  loadMeals();
});