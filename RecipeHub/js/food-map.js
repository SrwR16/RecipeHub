/**
 * Food Map - Location-Based Community Food Discovery
 * Real location tracking, precise food mapping, and navigation assistance
 */

class FoodMapApp {
  constructor() {
    // Use current host for API calls to work on different devices
    const currentHost = window.location.hostname;
    this.apiBaseUrl = `http://${currentHost}:8000/api/food-map`;
    this.map = null;
    this.userLocation = null;
    this.userLocationMarker = null;
    this.foodItemMarkers = new Map();
    this.currentFoodItems = [];
    this.categories = [];
    this.userFavorites = new Set();
    this.googleMapsApiKey = null;
    this.searchRadius = 2000; // Default 2km
    this.locationContext = null;
    this.isTrackingLocation = false;

    this.init();
  }

  async init() {
    try {
      // Initialize Google Maps API key
      await this.loadGoogleMapsApiKey();

      // Initialize map
      this.initializeMap();

      // Load initial data
      await this.loadCategories();
      await this.loadUserFavorites();

      // Set up event listeners
      this.setupEventListeners();

      // Request user location
      this.requestUserLocation();

      this.showNotification("🗺️ Food Map loaded! Click on the map to add food items at specific locations.", "info");
    } catch (error) {
      console.error("Error initializing Food Map:", error);
      this.showError("Failed to initialize Food Map. Please refresh the page.");
    }
  }

  async loadGoogleMapsApiKey() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api-key/`);
      const data = await response.json();
      this.googleMapsApiKey = data.google_maps_api_key;
    } catch (error) {
      console.error("Error loading Google Maps API key:", error);
    }
  }

  initializeMap() {
    // Check if map container exists
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.warn("Map container not found");
      return;
    }

    // Initialize Leaflet map with a more generic default location (Central Europe)
    this.map = L.map("map").setView([50.1109, 8.6821], 10); // Default to Frankfurt (central Europe)

    // Add tile layer with better styling
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(this.map);

    // Add click event for adding new food items at exact locations
    this.map.on("click", (e) => {
      if (this.isAuthenticated()) {
        this.showAddFoodItemModal(e.latlng.lat, e.latlng.lng);
      } else {
        this.showError("Please log in to add food items to the map.");
      }
    });

    // Add location control
    this.addLocationControls();
  }

  addLocationControls() {
    // Add custom control for location features
    const locationControl = L.control({ position: "topright" });
    locationControl.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.innerHTML = `
        <div class="location-controls">
          <button onclick="foodMapApp.requestUserLocation()" title="Get My Location" class="location-btn">
            📍
          </button>
          <button onclick="foodMapApp.showNearbyRestaurants()" title="Show Nearby Restaurants" class="nearby-btn">
            🏪
          </button>
          <button onclick="foodMapApp.toggleLocationTracking()" title="Toggle Location Tracking" class="tracking-btn">
            🎯
          </button>
        </div>
      `;
      return div;
    };
    locationControl.addTo(this.map);
  }

  async loadCategories() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/categories/`);
      if (response.ok) {
        this.categories = await response.json();
        this.renderCategoryFilters();
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async loadUserFavorites() {
    if (!this.isAuthenticated()) return;

    try {
      const response = await fetch(`${this.apiBaseUrl}/favorites/`, {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        this.userFavorites = new Set(data.results?.map((f) => f.food_item.id) || []);
      }
    } catch (error) {
      console.error("Error loading user favorites:", error);
    }
  }

  async loadNearbyFoodItems() {
    if (!this.userLocation) {
      this.showError("📍 Location not available. Please enable location access to discover nearby food!");
      return;
    }

    this.showLoading("🔍 Searching for delicious food within 2km...");

    try {
      const requestData = {
        latitude: this.userLocation.lat,
        longitude: this.userLocation.lng,
        radius: this.searchRadius,
      };

      const response = await fetch(`${this.apiBaseUrl}/food-items/nearby/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.getCsrfToken(),
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentFoodItems = data.results || [];
        this.locationContext = data.location_context;

        this.renderFoodItemsOnMap();
        this.renderFoodItemsList();
        this.updateLocationInfo(data.search_area);
        this.hideLoading();

        if (data.results.length > 0) {
          this.showSuccess(`🎉 Found ${data.results.length} food items near you!`);
        } else {
          this.showNotification("😋 No food items found nearby. Be the first to add one!", "info");
        }
      } else {
        this.hideLoading();
        this.showError("Failed to load nearby food items");
      }
    } catch (error) {
      this.hideLoading();
      console.error("Error loading nearby food items:", error);
      this.showError("Failed to load nearby food items");
    }
  }

  async searchFoodItems(query) {
    if (!query.trim()) return;

    this.showLoading(`🔍 Searching for "${query}"...`);

    try {
      const requestData = {
        query: query.trim(),
      };

      if (this.userLocation) {
        requestData.latitude = this.userLocation.lat;
        requestData.longitude = this.userLocation.lng;
        requestData.radius = 5000; // 5km for search
      }

      const response = await fetch(`${this.apiBaseUrl}/food-items/search/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.getCsrfToken(),
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentFoodItems = data.results || [];
        if (data.location_context) {
          this.locationContext = data.location_context;
        }

        this.renderFoodItemsOnMap();
        this.renderFoodItemsList();
        this.hideLoading();
        this.showSearchResults(query, data.count || 0);
      } else {
        this.hideLoading();
        this.showError("Search failed. Please try again.");
      }
    } catch (error) {
      this.hideLoading();
      console.error("Error searching food items:", error);
      this.showError("Search failed. Please try again.");
    }
  }

  async showNearbyRestaurants() {
    if (!this.userLocation) {
      this.showError("Please enable location access first.");
      return;
    }

    this.showLoading("Finding nearby restaurants...");

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/location-context/?latitude=${this.userLocation.lat}&longitude=${this.userLocation.lng}`
      );

      if (response.ok) {
        const data = await response.json();
        this.hideLoading();
        this.displayNearbyRestaurants(data.nearby_restaurants);
      } else {
        this.hideLoading();
        this.showError("Failed to find nearby restaurants");
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Failed to find nearby restaurants");
    }
  }

  displayNearbyRestaurants(restaurants) {
    // Clear existing restaurant markers
    this.map.eachLayer((layer) => {
      if (layer.options && layer.options.isRestaurant) {
        this.map.removeLayer(layer);
      }
    });

    restaurants.forEach((restaurant) => {
      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        isRestaurant: true,
        icon: L.divIcon({
          className: "restaurant-marker",
          html: '<div style="background: #FF6B6B; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 14px;">🏪</div>',
          iconSize: [25, 25],
        }),
      }).addTo(this.map);

      marker.bindPopup(`
        <div class="restaurant-popup">
          <h4>${restaurant.name}</h4>
          <p><strong>Type:</strong> ${restaurant.amenity}</p>
          ${restaurant.cuisine ? `<p><strong>Cuisine:</strong> ${restaurant.cuisine}</p>` : ""}
          <p><strong>Distance:</strong> ${restaurant.distance.toFixed(2)}km</p>
          ${restaurant.address ? `<p><strong>Address:</strong> ${restaurant.address}</p>` : ""}
          ${restaurant.phone ? `<p><strong>Phone:</strong> ${restaurant.phone}</p>` : ""}
          <div class="popup-actions">
            <button onclick="foodMapApp.getDirections(${restaurant.latitude}, ${restaurant.longitude}, '${
        restaurant.name
      }')" class="btn-sm">🧭 Directions</button>
          </div>
        </div>
      `);
    });

    this.showSuccess(`Found ${restaurants.length} restaurants nearby`);
  }

  getDirections(lat, lng, name) {
    if (!this.userLocation) {
      this.showError("Your location is needed for directions");
      return;
    }

    // Open Google Maps with directions
    const googleMapsUrl = `https://www.google.com/maps/dir/${this.userLocation.lat},${this.userLocation.lng}/${lat},${lng}`;
    window.open(googleMapsUrl, "_blank");

    this.showSuccess(`🧭 Opening directions to ${name}`);
  }

  renderFoodItemsOnMap() {
    // Clear existing food item markers
    this.foodItemMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.foodItemMarkers.clear();

    // Add food item markers with enhanced styling
    this.currentFoodItems.forEach((foodItem) => {
      const marker = L.marker([foodItem.latitude, foodItem.longitude], {
        icon: L.divIcon({
          className: "food-item-marker",
          html: this.createMarkerIcon(foodItem),
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        }),
      }).addTo(this.map);

      marker.bindPopup(this.createFoodItemPopup(foodItem));
      this.foodItemMarkers.set(foodItem.id, marker);
    });

    // Fit map to show all markers if we have food items
    if (this.currentFoodItems.length > 0) {
      const group = new L.featureGroup(Array.from(this.foodItemMarkers.values()));
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  createMarkerIcon(foodItem) {
    const categoryColor = foodItem.category?.color || "#FF6B6B";
    const priceRange = this.getPriceRange(foodItem.price);

    return `
      <div class="food-marker" style="background: ${categoryColor}; border: 2px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        ${priceRange}
      </div>
    `;
  }

  getPriceRange(price) {
    if (price < 10) return "$";
    if (price < 25) return "$$";
    if (price < 50) return "$$$";
    return "$$$$";
  }

  renderFoodItemsList() {
    const container = document.getElementById("places-list");
    if (!container) return;

    container.innerHTML = "";

    if (this.currentFoodItems.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="empty-state">
            <h3>🍽️ No food items found nearby</h3>
            <p>Be the first to add delicious food to this area!</p>
            <button onclick="foodMapApp.requestUserLocation()" class="btn-primary">📍 Enable Location</button>
          </div>
        </div>
      `;
      return;
    }

    this.currentFoodItems.forEach((foodItem) => {
      const card = this.createFoodItemCard(foodItem);
      container.appendChild(card);
    });
  }

  createFoodItemCard(foodItem) {
    const card = document.createElement("div");
    card.className = "food-item-card";

    const distance = foodItem.distance ? `${foodItem.distance.toFixed(1)}km away` : "";
    const restaurantInfo = foodItem.restaurant_name ? `at ${foodItem.restaurant_name}` : "";

    card.innerHTML = `
      <div class="food-item-header">
        <div class="food-title">
          <h3>${foodItem.name}</h3>
          <p class="restaurant-name">${restaurantInfo}</p>
        </div>
        <div class="price-distance">
          <span class="price">${foodItem.price} ${foodItem.currency}</span>
          ${distance ? `<span class="distance">📍 ${distance}</span>` : ""}
        </div>
      </div>

      <div class="food-item-details">
        <p class="description">${foodItem.description}</p>

        <div class="location-info">
          <p class="address">📍 ${foodItem.address}</p>
          <div class="location-meta">
            <span class="city">${foodItem.city || "Unknown city"}</span>
            ${foodItem.contact_phone ? `<span class="phone">📞 ${foodItem.contact_phone}</span>` : ""}
          </div>
        </div>

        <div class="food-item-meta">
          <span class="category" style="background-color: ${foodItem.category?.color || "#ddd"}20; border-color: ${
      foodItem.category?.color || "#ddd"
    }">
            ${foodItem.category?.icon || "🍽️"} ${foodItem.category?.name || "Other"}
          </span>
          <span class="food-type">${this.formatFoodType(foodItem.food_type)}</span>
        </div>

        <div class="dietary-info">
          ${foodItem.is_vegetarian ? '<span class="tag vegetarian">🌱 Vegetarian</span>' : ""}
          ${foodItem.is_vegan ? '<span class="tag vegan">🌿 Vegan</span>' : ""}
          ${foodItem.is_gluten_free ? '<span class="tag gluten-free">🌾 Gluten Free</span>' : ""}
          ${foodItem.is_halal ? '<span class="tag halal">☪️ Halal</span>' : ""}
        </div>

        ${
          foodItem.average_rating
            ? `
          <div class="rating-info">
            <span class="rating">⭐ ${foodItem.average_rating.toFixed(1)}/5</span>
            <span class="reviews">(${foodItem.reviews_count} reviews)</span>
          </div>
        `
            : ""
        }
      </div>

      <div class="food-item-actions">
        <button onclick="foodMapApp.showOnMap('${foodItem.id}')" class="btn-secondary">
          🗺️ Show on Map
        </button>
        ${
          foodItem.distance
            ? `
          <button onclick="foodMapApp.getDirections(${foodItem.latitude}, ${foodItem.longitude}, '${foodItem.name}')" class="btn-secondary">
            🧭 Directions
          </button>
        `
            : ""
        }
        <button onclick="foodMapApp.toggleFavorite('${foodItem.id}')"
                class="btn-favorite ${this.userFavorites.has(foodItem.id) ? "active" : ""}">
          ${this.userFavorites.has(foodItem.id) ? "❤️" : "🤍"} Save
        </button>
      </div>
    `;
    return card;
  }

  formatFoodType(foodType) {
    const types = {
      homemade: "🏠 Homemade",
      restaurant: "🍽️ Restaurant",
      street_food: "🚚 Street Food",
      bakery: "🥖 Bakery",
      dessert: "🧁 Dessert",
      beverage: "🥤 Beverage",
      snack: "🍿 Snack",
      other: "🍴 Other",
    };
    return types[foodType] || "🍴 Other";
  }

  createFoodItemPopup(foodItem) {
    const distance = foodItem.distance ? `📍 ${foodItem.distance.toFixed(1)}km away` : "";
    const restaurant = foodItem.restaurant_name
      ? `<p class="restaurant"><strong>At:</strong> ${foodItem.restaurant_name}</p>`
      : "";

    return `
      <div class="food-item-popup">
        <h4>${foodItem.name}</h4>
        ${restaurant}
        <p class="price"><strong>Price:</strong> ${foodItem.price} ${foodItem.currency}</p>
        <p class="description">${foodItem.description.substring(0, 100)}${
      foodItem.description.length > 100 ? "..." : ""
    }</p>

        <div class="popup-meta">
          <span class="category">${foodItem.category?.icon || "🍽️"} ${foodItem.category?.name || ""}</span>
          ${distance ? `<span class="distance">${distance}</span>` : ""}
        </div>

        <div class="popup-actions">
          <button onclick="foodMapApp.toggleFavorite('${foodItem.id}')" class="btn-sm">
            ${this.userFavorites.has(foodItem.id) ? "❤️" : "🤍"}
          </button>
          ${
            foodItem.distance
              ? `
            <button onclick="foodMapApp.getDirections(${foodItem.latitude}, ${foodItem.longitude}, '${foodItem.name}')" class="btn-sm">
              🧭
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  updateLocationInfo(searchArea) {
    const locationInfo = document.getElementById("location-info");
    if (locationInfo && searchArea) {
      locationInfo.innerHTML = `
        <div class="current-location">
          <h4>📍 Your Current Area</h4>
          <p class="address">${searchArea.address}</p>
          <p class="area">${searchArea.city}, ${searchArea.country}</p>
          <p class="radius">Searching within ${this.searchRadius / 1000}km radius</p>
        </div>
      `;
    }
  }

  showAddFoodItemModal(lat, lng) {
    // Get location details first
    this.reverseGeocode(lat, lng).then((locationData) => {
      const modal = document.getElementById("add-restaurant-modal");
      if (!modal) {
        this.createAddFoodItemModal();
        return this.showAddFoodItemModal(lat, lng);
      }

      // Set coordinates and location data
      document.getElementById("food-item-latitude").value = lat;
      document.getElementById("food-item-longitude").value = lng;

      // Update the description placeholder with location info
      const descriptionField = document.getElementById("restaurant-address");
      if (descriptionField && !descriptionField.value) {
        descriptionField.placeholder = `Describe the dish... (Located at: ${locationData.formatted_address})`;
      }

      modal.classList.remove("hidden");

      // Show helpful location info
      const locationDisplay = document.getElementById("selected-location");
      if (locationDisplay) {
        locationDisplay.innerHTML = `
          <div class="location-preview">
            <p><strong>📍 Selected Location:</strong></p>
            <p>${locationData.formatted_address}</p>
            <p class="coordinates">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</p>
          </div>
        `;
      }
    });
  }

  createAddFoodItemModal() {
    const modal = document.createElement("div");
    modal.id = "add-food-item-modal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>🍽️ Add Food Item to Map</h2>
          <span class="close" onclick="document.getElementById('add-food-item-modal').style.display='none'">&times;</span>
        </div>

        <div id="selected-location" class="location-preview"></div>

        <form id="add-food-item-form">
          <div class="form-row">
            <div class="form-group">
              <label for="food-item-name">🍽️ Food Name *</label>
              <input type="text" id="food-item-name" required placeholder="e.g., Chicken Biryani, Pizza Margherita">
            </div>
            <div class="form-group">
              <label for="food-item-restaurant">🏪 Restaurant/Place Name</label>
              <input type="text" id="food-item-restaurant" placeholder="e.g., Joe's Pizza, Home Kitchen">
            </div>
          </div>

          <div class="form-group">
            <label for="food-item-description">📝 Description *</label>
            <textarea id="food-item-description" required placeholder="Describe the food, taste, special ingredients..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="food-item-price">💰 Price *</label>
              <input type="number" id="food-item-price" step="0.01" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="food-item-currency">Currency</label>
              <select id="food-item-currency">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="food-item-category">🏷️ Category *</label>
              <select id="food-item-category" required>
                <option value="">Select Category</option>
                ${this.categories.map((cat) => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label for="food-item-type">🍴 Food Type</label>
              <select id="food-item-type">
                <option value="homemade">🏠 Homemade</option>
                <option value="restaurant">🍽️ Restaurant Food</option>
                <option value="street_food">🚚 Street Food</option>
                <option value="bakery">🥖 Bakery Item</option>
                <option value="dessert">🧁 Dessert</option>
                <option value="beverage">🥤 Beverage</option>
                <option value="snack">🍿 Snack</option>
                <option value="other">🍴 Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="food-item-address">📍 Address *</label>
            <input type="text" id="food-item-address" required>
          </div>

          <div class="form-group">
            <label for="food-item-city">🏙️ City</label>
            <input type="text" id="food-item-city" placeholder="Will be auto-filled">
          </div>

          <div class="form-group">
            <label for="food-item-contact">📞 Contact Phone</label>
            <input type="tel" id="food-item-contact" placeholder="+1234567890">
          </div>

          <div class="form-group">
            <label>🌱 Dietary Information</label>
            <div class="checkbox-group">
              <label><input type="checkbox" id="food-item-vegetarian"> 🌱 Vegetarian</label>
              <label><input type="checkbox" id="food-item-vegan"> 🌿 Vegan</label>
              <label><input type="checkbox" id="food-item-gluten-free"> 🌾 Gluten Free</label>
              <label><input type="checkbox" id="food-item-halal"> ☪️ Halal</label>
            </div>
          </div>

          <input type="hidden" id="food-item-latitude">
          <input type="hidden" id="food-item-longitude">

          <div class="form-actions">
            <button type="button" onclick="document.getElementById('add-food-item-modal').style.display='none'" class="btn-secondary">❌ Cancel</button>
            <button type="submit" class="btn-primary">🎉 Add Food Item</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Add form submit handler
    document.getElementById("add-food-item-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddFoodItemSubmit();
    });
  }

  handleAddFoodItemSubmit() {
    // Map price range to actual price values
    const priceMapping = {
      $: 5.5, // Budget (€3-€8)
      $$: 13.0, // Moderate (€8-€18)
      $$$: 25.0, // Premium (€18+)
    };

    // Map food categories to backend category IDs
    const categoryMapping = {
      appetizer: "f2c26068-4f89-4fe5-8976-6bfe21dbb001", // Street Food
      "main-course": "a6bdddc0-1785-466d-9f75-aa79c2886000", // Italian
      dessert: "3bd61cc7-0fef-422d-86f9-b256c77d70e9", // Desserts
      beverage: "0a3ed34f-85c9-4fe6-8bf4-d6af1c6c4063", // Coffee & Cafes
      "street-food": "f2c26068-4f89-4fe5-8976-6bfe21dbb001", // Street Food
      signature: "85ae596e-b764-4231-a8f4-9c6ce865fa23", // Local Specialties
    };

    const priceRange = document.getElementById("restaurant-price").value;
    const categoryType = document.getElementById("restaurant-cuisine").value;

    const formData = {
      name: document.getElementById("restaurant-name").value,
      restaurant_name: document.getElementById("signature-dish").value,
      description: document.getElementById("restaurant-address").value,
      price: priceMapping[priceRange] || 10.0,
      currency: "€",
      category: categoryMapping[categoryType] || "230b2c22-5696-4ec7-a2a1-ad04dd79287e", // Default to Fast Food
      food_type: categoryType === "signature" ? "restaurant" : "homemade",
      address: "Community added location",
      city: "", // Will be filled by backend
      latitude: parseFloat(document.getElementById("food-item-latitude")?.value || 0),
      longitude: parseFloat(document.getElementById("food-item-longitude")?.value || 0),
      contact_phone: "",
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_halal: false,
    };

    this.addFoodItem(formData).then(() => {
      document.getElementById("add-restaurant-modal").classList.add("hidden");
      document.getElementById("add-restaurant-form").reset();
    });
  }

  async addFoodItem(foodItemData) {
    if (!this.isAuthenticated()) {
      this.showError("Please log in to add food items.");
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/food-items/`, {
        method: "POST",
        headers: {
          ...this.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(foodItemData),
      });

      if (response.ok) {
        const savedFoodItem = await response.json();
        this.showSuccess(`🎉 "${savedFoodItem.name}" added successfully to the map!`);
        this.loadNearbyFoodItems(); // Refresh the map
        return savedFoodItem;
      } else {
        const error = await response.json();
        this.showError(error.detail || "Failed to add food item.");
      }
    } catch (error) {
      console.error("Error adding food item:", error);
      this.showError("Failed to add food item. Please try again.");
    }
  }

  async toggleFavorite(foodItemId) {
    if (!this.isAuthenticated()) {
      this.showError("Please log in to save favorites.");
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/food-items/${foodItemId}/favorite/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_favorite) {
          this.userFavorites.add(foodItemId);
          this.showSuccess("❤️ Added to favorites!");
        } else {
          this.userFavorites.delete(foodItemId);
          this.showSuccess("💔 Removed from favorites!");
        }
        this.updateFavoriteButtons(foodItemId);
      } else {
        this.showError("Failed to update favorites.");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      this.showError("Failed to update favorites.");
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/reverse-geocode/?latitude=${lat}&longitude=${lng}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
    return {
      formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      city: "",
      country: "",
    };
  }

  requestUserLocation() {
    if (!navigator.geolocation) {
      this.showError("Geolocation is not supported by this browser.");
      return;
    }

    this.showNotification("🔍 Detecting your location...", "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log("📍 Location detected:", this.userLocation);

        if (this.map) {
          // Update map center with smooth animation
          this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);

          // Add user location marker with better styling
          if (this.userLocationMarker) {
            this.map.removeLayer(this.userLocationMarker);
          }

          this.userLocationMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: L.divIcon({
              className: "user-location-marker",
              html: `
                <div style="
                  width: 20px; height: 20px;
                  background: #3B82F6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.5);
                  animation: pulse 2s infinite;
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }).addTo(this.map);

          this.userLocationMarker.bindPopup("📍 You are here!").openPopup();
        }

        // Load nearby food items
        this.loadNearbyFoodItems();
        this.showSuccess(`📍 Location found! Now discovering food around you...`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "📍 Unable to detect your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }

        this.showError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }

  toggleLocationTracking() {
    this.isTrackingLocation = !this.isTrackingLocation;

    if (this.isTrackingLocation) {
      this.showSuccess("🎯 Location tracking enabled");
      // Watch position for continuous updates
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (this.userLocationMarker) {
            this.userLocationMarker.setLatLng([this.userLocation.lat, this.userLocation.lng]);
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
      );
    } else {
      this.showNotification("📍 Location tracking disabled", "info");
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
      }
    }
  }

  setupEventListeners() {
    // Search form
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = document.getElementById("search-input").value;
        this.searchFoodItems(query);
      });
    }

    // Location button
    const locationBtn = document.getElementById("location-btn");
    if (locationBtn) {
      locationBtn.addEventListener("click", () => {
        this.requestUserLocation();
      });
    }

    // Add food item button
    const addFoodBtn = document.getElementById("add-food-btn");
    if (addFoodBtn) {
      addFoodBtn.addEventListener("click", () => {
        if (this.userLocation) {
          this.showAddFoodItemModal(this.userLocation.lat, this.userLocation.lng);
        } else {
          this.showError("📍 Please enable location access first.");
        }
      });
    }

    // Radius selector
    const radiusSelector = document.getElementById("radius-selector");
    if (radiusSelector) {
      radiusSelector.addEventListener("change", (e) => {
        this.searchRadius = parseInt(e.target.value);
        if (this.userLocation) {
          this.loadNearbyFoodItems();
        }
      });
    }
  }

  renderCategoryFilters() {
    const container = document.getElementById("category-filters");
    if (!container) return;

    container.innerHTML = `
      <button class="filter-btn active" onclick="foodMapApp.filterByCategory('')">🍽️ All</button>
      ${this.categories
        .map(
          (category) => `
        <button class="filter-btn" onclick="foodMapApp.filterByCategory('${category.name}')"
                style="background-color: ${category.color}20; border-color: ${category.color}">
          ${category.icon} ${category.name}
        </button>
      `
        )
        .join("")}
    `;
  }

  showOnMap(foodItemId) {
    const foodItem = this.currentFoodItems.find((item) => item.id === foodItemId);
    if (foodItem) {
      this.map.setView([foodItem.latitude, foodItem.longitude], 17);
      const marker = this.foodItemMarkers.get(foodItemId);
      if (marker) {
        marker.openPopup();
      }
    }
  }

  filterByCategory(categoryName) {
    // Update active filter button
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    event.target.classList.add("active");

    // Filter food items
    if (categoryName) {
      const filtered = this.currentFoodItems.filter((item) =>
        item.category?.name.toLowerCase().includes(categoryName.toLowerCase())
      );
      this.renderFilteredFoodItems(filtered);
    } else {
      this.renderFoodItemsList();
    }
  }

  renderFilteredFoodItems(filteredItems) {
    const container = document.getElementById("places-list");
    if (!container) return;

    container.innerHTML = "";

    if (filteredItems.length === 0) {
      container.innerHTML = '<div class="no-results">No food items found in this category.</div>';
      return;
    }

    filteredItems.forEach((foodItem) => {
      const card = this.createFoodItemCard(foodItem);
      container.appendChild(card);
    });
  }

  updateFavoriteButtons(foodItemId) {
    const buttons = document.querySelectorAll(`[onclick="foodMapApp.toggleFavorite('${foodItemId}')"]`);
    buttons.forEach((button) => {
      if (this.userFavorites.has(foodItemId)) {
        button.classList.add("active");
        button.innerHTML = button.innerHTML.replace("🤍", "❤️");
      } else {
        button.classList.remove("active");
        button.innerHTML = button.innerHTML.replace("❤️", "🤍");
      }
    });
  }

  showSearchResults(query, count) {
    const container = document.getElementById("search-results");
    if (container) {
      container.innerHTML = `🔍 Search results for "${query}": ${count} items found`;
    }
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    const container = document.getElementById("notifications") || document.body;
    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showLoading(message) {
    const loader = document.getElementById("loading");
    if (loader) {
      loader.textContent = message;
      loader.style.display = "block";
    }
  }

  hideLoading() {
    const loader = document.getElementById("loading");
    if (loader) {
      loader.style.display = "none";
    }
  }

  isAuthenticated() {
    const hasSessionId = document.cookie.includes("sessionid");
    const hasAuthToken = localStorage.getItem("authToken") || localStorage.getItem("tokens");
    const isAuthenticated = hasSessionId || hasAuthToken;

    console.log("Authentication check:", {
      hasSessionId,
      hasAuthToken: !!hasAuthToken,
      isAuthenticated,
    });

    return isAuthenticated;
  }

  getAuthHeaders() {
    const headers = {};

    // Add CSRF token
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }

    // Add authorization token if available
    const authToken = localStorage.getItem("authToken") || localStorage.getItem("tokens");
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    console.log("Auth headers:", headers);
    return headers;
  }

  getCsrfToken() {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "csrftoken") {
        return value;
      }
    }
    return null;
  }
}

// Initialize the app when the page loads
let foodMapApp;
document.addEventListener("DOMContentLoaded", () => {
  foodMapApp = new FoodMapApp();
});

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .food-marker {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);
