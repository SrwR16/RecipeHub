/**
 * API Configuration for RecipeHub
 * Handles API calls for both localhost and network access
 */

// Determine the correct API base URL
const getApiBaseUrl = () => {
  const currentHost = window.location.hostname;
  const protocol = window.location.protocol;

  // If accessing via network IP, use that IP for API calls
  if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
    return `${protocol}//${currentHost}:8000`;
  }

  // Default to localhost for local development
  return `${protocol}//localhost:8000`;
};

// Global API configuration
window.RecipeHubAPI = {
  baseUrl: getApiBaseUrl(),

  // Helper method to make API calls with proper URL
  async fetchAPI(endpoint, options = {}) {
    const url = endpoint.startsWith("/") ? `${this.baseUrl}${endpoint}` : endpoint;

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  },

  // Helper method for JSON API calls
  async fetchJSON(endpoint, options = {}) {
    const response = await this.fetchAPI(endpoint, options);
    return response.json();
  },
};

// Override fetch for relative API calls
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  // If it's a relative API call starting with /api/, convert to absolute URL
  if (typeof input === "string" && input.startsWith("/api/")) {
    input = `${RecipeHubAPI.baseUrl}${input}`;
  }

  return originalFetch.call(this, input, init);
};

console.log("RecipeHub API configured for:", RecipeHubAPI.baseUrl);
