const navBar = () => {
  const login = document.getElementById("login-control");
  if (!login) return; // Exit if element doesn't exist

  const token = localStorage.getItem("tokens");
  const tokens = JSON.parse(token);
  if (tokens) {
    login.innerHTML = `
      <a href="profile.html" class="btn text-white" style="background-color: #77574c">Profile</a>
      <a onclick="logout()" class="btn text-white" style="background-color: #77574c">Logout</a>
      `;
  } else {
    login.innerHTML = `
      <a href="./auth.html" class="btn text-white" style="background-color: #77574c">Login</a>
      `;
  }
};

const loadPostForTrending = () => {
  fetch("/api/kitchen/post/")
    .then((res) => res.json())
    .then((data) => {
      const winterRecipes = data.filter((item) => item.seasonal === "Winter");
      displayTrendingData(winterRecipes);
    })
    .catch((err) => console.error("Error fetching trending data:", err));
};

const displayTrendingData = (items) => {
  const trend = document.getElementById("trending");
  if (!trend) return; // Exit if element doesn't exist

  // Clear previous content
  trend.innerHTML = "";

  if (!items || items.length === 0) {
    trend.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-chart-line text-2xl mb-3 block"></i>
        <p>No trending recipes available</p>
      </div>
    `;
    return;
  }

  items.forEach((item, index) => {
    const trendItem = `
      <div class="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group cursor-pointer">
        <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
          ${index + 1}
        </div>
        <div class="flex-1 min-w-0">
          <a href="recipe.html?recipeId=${item.id}" class="block">
            <h4 class="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
              ${item.title}
            </h4>
            <p class="text-sm text-gray-500 mt-1">
              <i class="fas fa-snowflake mr-1"></i>
              Winter Special
            </p>
          </a>
        </div>
        <div class="flex-shrink-0">
          <i class="fas fa-arrow-right text-gray-400 group-hover:text-orange-500 transition-colors"></i>
        </div>
      </div>
    `;
    trend.innerHTML += trendItem;
  });
};

const popularRecipeCount = () => {
  fetch("/api/comment/react/list/")
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.length === 0) {
        console.log("No reaction data available");
        return;
      }

      // Create a map to count occurrences of each recipe_id
      const recipeCount = {};
      data.forEach((item) => {
        const recipeId = item.recipe;
        if (recipeCount[recipeId]) {
          recipeCount[recipeId]++;
        } else {
          recipeCount[recipeId] = 1;
        }
      });
      const popularRecipes = Object.keys(recipeCount).filter((recipeId) => recipeCount[recipeId] >= 3);
      getPopularRecipe(popularRecipes);
    })
    .catch((error) => console.error("Error fetching reaction data:", error));
};

const getPopularRecipe = (recipeIdObject) => {
  if (!recipeIdObject || recipeIdObject.length === 0) {
    console.log("No popular recipes found");
    return;
  }

  const recipeIds = Object.values(recipeIdObject);
  fetch("/api/kitchen/post/")
    .then((res) => res.json())
    .then((data) => {
      // Filter the recipes whose recipe IDs match the extracted recipeIds
      const filteredRecipes = data.filter((recipe) => recipeIds.includes(String(recipe.id)));
      displayPopularRecipe(filteredRecipes);
    })
    .catch((error) => console.error("Error fetching recipes:", error));
};

const displayPopularRecipe = (recipes) => {
  const container = document.getElementById("recipe-container");
  if (!container) return; // Exit if element doesn't exist

  container.innerHTML = "";

  if (!recipes || recipes.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">
      <i class="fas fa-utensils text-3xl mb-4 block"></i>
      <p class="text-lg">No recipes available at the moment</p>
    </div>`;
    return;
  }

  recipes.forEach((recipe) => {
    const recipeCard = `
      <div class="group cursor-pointer transform hover:scale-105 transition-all duration-300" data-recipe-id="${
        recipe.id
      }">
        <div class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
          <div class="relative h-48 overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              src="${
                recipe.media ||
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
              }"
              alt="${recipe.title}"
              onerror="this.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div class="absolute top-3 right-3">
              <span class="bg-white/90 backdrop-blur-sm text-orange-600 px-2 py-1 rounded-full text-sm font-medium">
                ${recipe.seasonal || "All Season"}
              </span>
            </div>
              </div>
          <div class="p-6">
            <h3 class="font-display text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              <a href="recipe.html?recipeId=${recipe.id}" class="hover:text-orange-600 transition-colors">
                ${recipe.title}
              </a>
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              ${
                recipe.ingredients
                  ? recipe.ingredients.substring(0, 100) + "..."
                  : "Delicious recipe waiting for you to discover"
              }
            </p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">
                <i class="fas fa-map-marker-alt mr-1"></i>
                ${recipe.region || "Global"}
              </span>
              <div class="flex items-center space-x-1">
                <i class="fas fa-star text-yellow-400"></i>
                <span class="text-sm font-medium text-gray-700">4.5</span>
              </div>
            </div>
          </div>
              </div>
            </div>
        `;
    container.innerHTML += recipeCard;
  });
};

// Logout function is defined globally in HTML files

// Filter functionality for recipe categories
const initializeFilters = () => {
  const filterButtons = document.querySelectorAll(".flex.space-x-2 button");

  filterButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      // Update active button styles
      filterButtons.forEach((btn) => {
        btn.classList.remove("bg-orange-500", "text-white");
        btn.classList.add("bg-gray-100", "text-gray-600");
      });

      button.classList.remove("bg-gray-100", "text-gray-600");
      button.classList.add("bg-orange-500", "text-white");

      // Load content based on filter
      const filterType = button.textContent.trim().toLowerCase();
      loadFilteredRecipes(filterType);
    });
  });
};

const loadFilteredRecipes = (filterType) => {
  const container = document.getElementById("recipe-container");
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p class="text-gray-500">Loading ${filterType} recipes...</p>
    </div>
  `;

  fetch("/api/kitchen/post/")
    .then((res) => res.json())
    .then((data) => {
      let filteredData = [];

      switch (filterType) {
        case "all":
          filteredData = data;
          break;
        case "popular":
          // Use the existing popular recipe logic
          popularRecipeCount();
          return; // Exit early as popularRecipeCount handles the display
        case "winter":
          filteredData = data.filter((item) => item.seasonal === "Winter");
          break;
        case "regional":
          filteredData = data.filter((item) => item.region && item.region !== "");
          break;
        default:
          filteredData = data;
      }

      displayPopularRecipe(filteredData);
    })
    .catch((err) => {
      console.error("Error fetching filtered data:", err);
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-red-500">
          <i class="fas fa-exclamation-triangle text-3xl mb-4 block"></i>
          <p class="text-lg">Error loading recipes. Please try again.</p>
        </div>
      `;
    });
};

// Load podcast previews
const loadPodcastPreviews = () => {
  fetch("/api/podcast/list/")
    .then((res) => res.json())
    .then((data) => {
      displayPodcastPreviews(data.slice(0, 3)); // Show only first 3 podcasts
    })
    .catch((err) => {
      console.error("Error fetching podcast data:", err);
      const container = document.getElementById("podcast-container");
      if (container) {
        container.innerHTML = `
          <div class="text-center py-6 text-gray-500">
            <i class="fas fa-podcast text-2xl mb-3 block"></i>
            <p>No podcasts available at the moment</p>
          </div>
        `;
      }
    });
};

const displayPodcastPreviews = (podcasts) => {
  const container = document.getElementById("podcast-container");
  if (!container) return;

  container.innerHTML = "";

  if (!podcasts || podcasts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-gray-500">
        <i class="fas fa-podcast text-2xl mb-3 block"></i>
        <p>No podcasts available</p>
      </div>
    `;
    return;
  }

  podcasts.forEach((podcast, index) => {
    const isFirstEpisode = index === 0;
    const badgeText = isFirstEpisode ? "Featured" : "Premium";
    const badgeClass = isFirstEpisode ? "bg-orange-500" : "bg-purple-500";

    const podcastCard = `
      <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:bg-white/80 transition-all duration-300">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-play text-white text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center mb-2">
              <span class="${badgeClass} text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                ${badgeText}
              </span>
              <span class="text-gray-500 text-sm">${podcast.duration || "25 min"}</span>
            </div>
            <h4 class="font-semibold text-gray-900 mb-1 truncate">
              <a href="podcast.html?id=${podcast.id}" class="hover:text-purple-600 transition-colors">
                ${podcast.title}
              </a>
            </h4>
            <p class="text-sm text-gray-600 line-clamp-2">
              ${
                podcast.description
                  ? podcast.description.substring(0, 100) + "..."
                  : "Discover culinary insights and cooking tips from expert chefs"
              }
            </p>
            <div class="flex items-center mt-2">
              <div class="flex text-yellow-400 mr-2">
                <i class="fas fa-star text-xs"></i>
                <i class="fas fa-star text-xs"></i>
                <i class="fas fa-star text-xs"></i>
                <i class="fas fa-star text-xs"></i>
                <i class="fas fa-star text-xs"></i>
              </div>
              <span class="text-xs text-gray-500">${
                podcast.creation_date ? new Date(podcast.creation_date).toLocaleDateString() : "New Episode"
              }</span>
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += podcastCard;
  });
};

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  navBar();
  loadPostForTrending();
  popularRecipeCount(); // Load popular recipes by default
  initializeFilters();
  loadPodcastPreviews(); // Load podcast previews
});
