document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const USER_ID = currentUser?._id;

  const groceryTotalCost = document.getElementById('groceryTotalCost');
  const groceryListContainer = document.getElementById('groceryListContainer');

  // redirect if not logged in
  if (!USER_ID) {
    window.location.href = '/login.html';
    return;
  }

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
      renderGroceryListLoadingState();

      const currentMealPlan = await loadDraftMealPlan();

      if (!currentMealPlan || !currentMealPlan._id) {
        renderMessage(
          'No meal plan found.',
          'Add meals to your meal plan before viewing your grocery list.'
        );
        return;
      }

      const latestGroceryList = await loadLatestGroceryList(currentMealPlan._id);

      if (!latestGroceryList) {
        renderMessage(
          'No grocery list generated yet.',
          'Your grocery list will automatically update as you add or remove meals from your meal plan.'
        );
        return;
      }

      renderGroceryList(latestGroceryList);
    } catch (error) {
      console.error('Error loading grocery list page:', error);
      renderMessage('Unable to load grocery list.', error.message);
    }
  }

  function renderGroceryList(groceryList) {
    const items = groceryList.items || [];

    updateVisibleGroceryTotal(items);

    if (!items.length) {
      renderMessage(
        'No grocery items found.',
        'Your meal plan may not have any ingredients attached to its meals yet.'
      );
      return;
    }

    groceryListContainer.innerHTML = '';

    items.forEach((item) => {
      const quantityIncreased =
        item.checked &&
        item.checkedQuantity !== null &&
        item.totalQuantity > item.checkedQuantity;

      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4';

      col.innerHTML = `
        <div 
          class="feature-card grocery-card h-100 ${item.checked ? 'checked-off' : ''} ${
            quantityIncreased ? 'quantity-increased' : ''
          }"
          data-ingredient-id="${escapeHtml(item.ingredientId)}"
        >
          ${
            quantityIncreased
              ? `<div class="quantity-increased-note mb-2">⚠ Quantity increased since checked off.</div>`
              : ''
          }

          <h3>${escapeHtml(item.name)}</h3>

          <p class="mb-2">
            <strong>Quantity:</strong>
            ${item.totalQuantity} ${escapeHtml(item.unit)}
          </p>

          <p class="price mb-0">
            Estimated cost: $${Number(item.estimatedLineCost || 0).toFixed(2)}
          </p>
        </div>
      `;

      groceryListContainer.appendChild(col);
    });

    setupGroceryCheckoff(groceryList.mealPlanId);
  }

  function updateVisibleGroceryTotal(items) {
  const remainingTotal = items
    .filter((item) => !item.checked)
    .reduce((sum, item) => {
      return sum + Number(item.estimatedLineCost || 0);
    }, 0);

  groceryTotalCost.textContent = `$${remainingTotal.toFixed(2)}`;
  }

  function setupGroceryCheckoff(mealPlanId) {
    const groceryCards = document.querySelectorAll('.grocery-card');

    groceryCards.forEach((card) => {
      card.addEventListener('click', async () => {
        const ingredientId = card.dataset.ingredientId;

        const isChecked = card.classList.contains('checked-off');
        const newCheckedState = !isChecked;

        card.classList.toggle('checked-off');

        try {
          const response = await fetch(
            `/api/meal-plans/${mealPlanId}/grocery-lists/items/${encodeURIComponent(
              ingredientId
            )}/checked`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                checked: newCheckedState
              })
            }
          );

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(
              errorResult.error?.message || 'Unable to update grocery item.'
            );
          }

          updateCardState(card, newCheckedState);
          updateVisibleGroceryTotalFromDOM();

        } catch (error) {
          console.error('Error updating grocery item:', error);

          // rollback UI if request fails
          card.classList.toggle('checked-off');
          alert(error.message || 'Unable to update grocery item.');
        }
      });
    });
  }

  function updateVisibleGroceryTotalFromDOM() {
  const groceryCards = document.querySelectorAll('.grocery-card');

  let total = 0;

  groceryCards.forEach((card) => {
    if (!card.classList.contains('checked-off')) {
      const priceText = card.querySelector('.price').textContent;
      const match = priceText.match(/\$([\d.]+)/);

      if (match) {
        total += Number(match[1]);
      }
    }
  });

  groceryTotalCost.textContent = `$${total.toFixed(2)}`;
  }

  function renderMessage(title, message) {
    groceryTotalCost.textContent = '$0.00';

    groceryListContainer.innerHTML = `
      <div class="col-12">
        <div class="feature-card">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  function renderGroceryListLoadingState() {
    groceryTotalCost.textContent = '--';

    groceryListContainer.innerHTML = `
      <div class="col-12">
        <div class="feature-card">
          <h3 class="loading-dots">Loading your grocery list...</h3>
          <p>Gathering your ingredients and totals...</p>
        </div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function updateCardState(card, isChecked) {
  if (!isChecked) {
    card.classList.remove('checked-off');
    card.classList.remove('quantity-increased');

    const note = card.querySelector('.quantity-increased-note');
    if (note) note.remove();

    return;
  }
}

  loadGroceryListPage();
});