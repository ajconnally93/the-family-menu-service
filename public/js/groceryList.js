const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const USER_ID = currentUser?._id;

const groceryTotalCost = document.getElementById('groceryTotalCost');
const groceryListContainer = document.getElementById('groceryListContainer');

// deprecated - don't need generate grocery list button since it is updated automatically as meals are added or removed from the meal plan
// const generateGroceryListBtn = document.getElementById('generateGroceryListBtn');

if (!USER_ID) {
  window.location.href = '/login.html';
}

let currentMealPlan = null;

async function loadDraftMealPlan() {
  const response = await fetch(
    `/api/meal-plans?userId=${encodeURIComponent(USER_ID)}&status=draft`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Unable to load meal plan.');
  }

  const rawData = result.data;
  return Array.isArray(rawData) ? rawData[0] : rawData;
}

async function loadLatestGroceryList(planId) {
  const response = await fetch(
    `/api/meal-plans/${planId}/grocery-lists/latest`
  );

  const result = await response.json();

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(result.error?.message || 'Unable to load grocery list.');
  }

  return result.data;
}

async function loadGroceryListPage() {
  try {
    currentMealPlan = await loadDraftMealPlan();

    if (!currentMealPlan || !currentMealPlan._id) {
      renderMessage(
        'No meal plan found.',
        'Add meals to your meal plan before generating a grocery list.'
      );
      return;
    }

    const latestGroceryList = await loadLatestGroceryList(currentMealPlan._id);

    if (!latestGroceryList) {
      renderMessage(
        'No grocery list generated yet.',
        'Click “Generate Grocery List” to create a consolidated list from your meal plan.'
      );
      return;
    }

    renderGroceryList(latestGroceryList);
  } catch (error) {
    console.error('Error loading grocery list page:', error);
    renderMessage('Unable to load grocery list.', error.message);
  }
}

// deprecated - don't need generate grocery list button anymore

// async function generateGroceryList() {
//   try {
//     generateGroceryListBtn.disabled = true;
//     generateGroceryListBtn.textContent = 'Generating...';

//     if (!currentMealPlan || !currentMealPlan._id) {
//       currentMealPlan = await loadDraftMealPlan();
//     }

//     if (!currentMealPlan || !currentMealPlan._id) {
//       renderMessage(
//         'No meal plan found.',
//         'Add meals to your meal plan before generating a grocery list.'
//       );
//       return;
//     }

//     const response = await fetch(
//       `/api/meal-plans/${currentMealPlan._id}/grocery-lists/generate`,
//       {
//         method: 'POST'
//       }
//     );

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(result.error?.message || 'Unable to generate grocery list.');
//     }

//     renderGroceryList(result.data);
//   } catch (error) {
//     console.error('Error generating grocery list:', error);
//     renderMessage('Unable to generate grocery list.', error.message);
//   } finally {
//     generateGroceryListBtn.disabled = false;
//     generateGroceryListBtn.textContent = 'Generate Grocery List';
//   }
// }

function renderGroceryList(groceryList) {
  const items = groceryList.items || [];

  groceryTotalCost.textContent = `$${Number(groceryList.estimatedTotalCost || 0).toFixed(2)}`;

  if (!items.length) {
    renderMessage(
      'No grocery items found.',
      'Your meal plan may not have any ingredients attached to its meals yet.'
    );
    return;
  }

  groceryListContainer.innerHTML = '';

  items.forEach((item) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    col.innerHTML = `
      <div class="feature-card h-100">
        <h3>${item.name}</h3>
        <p class="mb-2">
          <strong>Quantity:</strong>
          ${item.totalQuantity} ${item.unit}
        </p>
        <p class="price mb-0">
          Estimated cost: $${Number(item.estimatedLineCost || 0).toFixed(2)}
        </p>
      </div>
    `;

    groceryListContainer.appendChild(col);
  });
}

function renderMessage(title, message) {
  groceryTotalCost.textContent = '$0.00';

  groceryListContainer.innerHTML = `
    <div class="col-12">
      <div class="feature-card">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
}

// deprecated
// generateGroceryListBtn.addEventListener('click', generateGroceryList);

loadGroceryListPage();