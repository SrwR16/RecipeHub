// Backend Connection Verification for RecipeHub
class BackendVerification {
  constructor() {
    this.baseURL = "";
    this.endpoints = {
      // Authentication endpoints
      auth: {
        login: "/api/auth/token/",
        refresh: "/api/auth/token/refresh/",
      },
      // User management
      user: {
        list: "/api/user/list/",
        profile: "/api/chat/profile/",
      },
      // Kitchen/Recipe endpoints
      kitchen: {
        posts: "/api/kitchen/post/",
      },
      // Comments and reactions
      comments: {
        list: "/api/comment/list/",
        reactions: "/api/comment/react/list/",
      },
      // Chat functionality
      chat: {
        groups: "/api/chat/group/",
        profile: "/api/chat/profile/",
      },
      // Podcasts
      podcast: {
        list: "/api/podcast/list/",
      },
      // Subscription
      subscription: {
        verify: "/api/subscription/verify/",
      },
    };
    this.results = {};
  }

  async testEndpoint(name, url, method = "GET", requiresAuth = false) {
    try {
      console.log(`Testing ${name}: ${method} ${url}`);

      const options = {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      // Add auth token if required
      if (requiresAuth) {
        const token = localStorage.getItem("tokens");
        if (token) {
          const tokens = JSON.parse(token);
          options.headers["Authorization"] = `Bearer ${tokens.access}`;
        }
      }

      const response = await fetch(url, options);
      const result = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        url: url,
      };

      if (response.ok) {
        try {
          result.data = await response.json();
          result.dataType = Array.isArray(result.data) ? "array" : "object";
          result.dataCount = Array.isArray(result.data) ? result.data.length : Object.keys(result.data).length;
        } catch (e) {
          result.data = await response.text();
          result.dataType = "text";
        }
      } else {
        try {
          result.error = await response.json();
        } catch (e) {
          result.error = await response.text();
        }
      }

      this.results[name] = result;
      return result;
    } catch (error) {
      console.error(`Error testing ${name}:`, error);
      const result = {
        status: "ERROR",
        ok: false,
        error: error.message,
        url: url,
      };
      this.results[name] = result;
      return result;
    }
  }

  async runAllTests() {
    console.log("🚀 Starting Backend Connection Verification...\n");

    // Test authentication endpoints
    await this.testEndpoint("User Registration", this.endpoints.user.list);
    await this.testEndpoint("User Profile", this.endpoints.user.profile);

    // Test kitchen/recipe endpoints
    await this.testEndpoint("Recipe Posts", this.endpoints.kitchen.posts);

    // Test comment system
    await this.testEndpoint("Comments", this.endpoints.comments.list);
    await this.testEndpoint("Reactions", this.endpoints.comments.reactions);

    // Test chat functionality
    await this.testEndpoint("Chat Groups", this.endpoints.chat.groups);
    await this.testEndpoint("Chat Profile", this.endpoints.chat.profile);

    // Test podcast system
    await this.testEndpoint("Podcasts", this.endpoints.podcast.list);

    this.generateReport();
  }

  generateReport() {
    console.log("\n📊 Backend Connection Report:");
    console.log("=".repeat(50));

    let successCount = 0;
    let errorCount = 0;
    let totalCount = 0;

    for (const [name, result] of Object.entries(this.results)) {
      totalCount++;
      const status = result.ok ? "✅" : "❌";
      const dataInfo = result.dataCount !== undefined ? ` (${result.dataCount} items)` : "";

      console.log(`${status} ${name}: ${result.status}${dataInfo}`);

      if (result.ok) {
        successCount++;
      } else {
        errorCount++;
        console.log(`   Error: ${result.error || result.statusText}`);
      }
    }

    console.log("=".repeat(50));
    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${errorCount}/${totalCount}`);
    console.log(`📈 Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);

    // Frontend Connection Status
    console.log("\n🔗 Frontend Connection Status:");
    this.checkFrontendConnections();

    return this.results;
  }

  checkFrontendConnections() {
    const connections = [
      { name: "Recipe Container", element: "#recipe-container", required: true },
      { name: "Trending Container", element: "#trending", required: true },
      { name: "Podcast Container", element: "#podcast-container", required: false },
      { name: "Post Container (Timeline)", element: "#post-container", required: false },
      { name: "Group List", element: "#group-list", required: false },
      { name: "Post Form", element: "#postForm", required: false },
      { name: "AI Response Container", element: "#ai_response", required: false },
      { name: "Order List", element: "#order-list", required: false },
    ];

    connections.forEach((conn) => {
      const element = document.querySelector(conn.element);
      const status = element ? "✅" : conn.required ? "❌" : "⚠️";
      const note = element ? "Found" : conn.required ? "MISSING (Required)" : "Not found (Optional)";
      console.log(`${status} ${conn.name}: ${note}`);
    });
  }

  // Test specific page functionality
  async testHomePage() {
    console.log("\n🏠 Testing Homepage Functionality...");

    // Test recipe loading
    if (typeof popularRecipeCount === "function") {
      console.log("✅ popularRecipeCount function available");
    } else {
      console.log("❌ popularRecipeCount function missing");
    }

    // Test trending loading
    if (typeof loadPostForTrending === "function") {
      console.log("✅ loadPostForTrending function available");
    } else {
      console.log("❌ loadPostForTrending function missing");
    }

    // Test filter functionality
    if (typeof initializeFilters === "function") {
      console.log("✅ initializeFilters function available");
    } else {
      console.log("❌ initializeFilters function missing");
    }

    // Test podcast loading
    if (typeof loadPodcastPreviews === "function") {
      console.log("✅ loadPodcastPreviews function available");
    } else {
      console.log("❌ loadPodcastPreviews function missing");
    }
  }

  // Manual test runner for debugging
  static async runQuickTest() {
    const verifier = new BackendVerification();
    await verifier.runAllTests();
    await verifier.testHomePage();
    return verifier.results;
  }
}

// Auto-run verification when script loads (for debugging)
if (typeof window !== "undefined") {
  window.BackendVerification = BackendVerification;

  // Add to console for manual testing
  console.log("Backend Verification loaded. Run BackendVerification.runQuickTest() to test connections.");
}

// Export for Node.js if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = BackendVerification;
}
