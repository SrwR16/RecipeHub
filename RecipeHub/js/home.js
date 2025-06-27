const navBar = () => {
  const login = document.getElementById("login-control");
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
  fetch("http://127.0.0.1:8000/kitchen/post/")
    .then((res) => res.json())
    .then((data) => {
      const winterRecipes = data.filter((item) => item.seasonal === "Winter");
      displayTrendingData(winterRecipes);
    })
    .catch((err) => console.error("Error fetching data:", err));
};

const displayTrendingData = (items) => {
  const trend = document.getElementById("trending");
  // Clear previous content
  trend.innerHTML = "";
  items.forEach((item) => {
    trend.innerHTML += `
            <a class="trending-text" href="recipe.html?recipeId=${item.id}">${item.title}</a>
            
            <hr class="trending-horizontal-line" />
        `;
  });
};

document.addEventListener("DOMContentLoaded", loadPostForTrending);

const popularRecipeCount = () => {
  fetch("http://127.0.0.1:8000/comment/react/list/")
    .then((res) => res.json())
    .then((data) => {
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
    .catch((error) => console.error("Error fetching data:", error));
};

const getPopularRecipe = (recipeIdObject) => {
  const recipeIds = Object.values(recipeIdObject);
  fetch("http://127.0.0.1:8000/kitchen/post/")
    .then((res) => res.json())
    .then((data) => {
      // Filter the recipes whose recipe IDs match the extracted recipeIds
      const filteredRecipes = data.filter((recipe) => recipeIds.includes(String(recipe.id)));
      displayPopularRecipe(filteredRecipes);
    })
    .catch((error) => console.error("Error fetching recipes:", error));
};

const displayPopularRecipe = (recipes) => {
  const container = document.querySelector(".lg\\:col-span-9");
  container.innerHTML = "";
  recipes.forEach((recipe) => {
    const recipeCard = `
            <div class="bg-base-100 w-full lg:w-56 card-height-control relative" data-recipe-id="${recipe.id}">
              <div class="w-full h-48 overflow-hidden hidden lg:block">
                <img class="h-full w-full object-cover" src="${recipe.media}" alt="${recipe.title}" />
              </div>
              <div class="absolute bottom-0 card-text-size px-3 pb-5 lg:pb-3 font-semibold">
                <a href="recipe.html?recipeId=${recipe.id}">${recipe.title}</a>
              </div>
            </div>
        `;
    container.innerHTML += recipeCard;
  });
};

const logout = () => {
  alert("Logout Successfully");
  localStorage.removeItem("tokens");
  localStorage.removeItem("user_id");
  window.location.href = "auth.html";
};
navBar();
popularRecipeCount();
