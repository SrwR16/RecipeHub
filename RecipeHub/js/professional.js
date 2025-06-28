// Professional RecipeHub JavaScript
class RecipeHubProfessional {
  constructor() {
    this.user = null;
    this.notifications = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupEventListeners();
    this.initializeNotifications();
    this.loadUserData();
  }

  // Authentication Management
  checkAuthentication() {
    const token = localStorage.getItem("tokens");
    if (token) {
      try {
        const tokens = JSON.parse(token);
        const tokenPayload = this.decodeJWT(tokens.access);
        this.user = {
          id: tokenPayload.user_id,
          username: tokenPayload.username || "User",
          isLoggedIn: true,
        };
        this.updateUIForLoggedInUser();
      } catch (error) {
        console.error("Authentication error:", error);
        this.logout();
      }
    } else {
      this.updateUIForLoggedOutUser();
    }
  }

  decodeJWT(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  updateUIForLoggedInUser() {
    // Update navigation for logged-in state
    const userMenus = document.querySelectorAll('[x-show="userLoggedIn"]');
    userMenus.forEach((menu) => {
      menu.style.display = "block";
    });

    const guestMenus = document.querySelectorAll('[x-show="!userLoggedIn"]');
    guestMenus.forEach((menu) => {
      menu.style.display = "none";
    });

    // Update Alpine.js data if available
    this.updateAlpineData("userLoggedIn", true);
  }

  updateUIForLoggedOutUser() {
    // Update navigation for logged-out state
    const userMenus = document.querySelectorAll('[x-show="userLoggedIn"]');
    userMenus.forEach((menu) => {
      menu.style.display = "none";
    });

    const guestMenus = document.querySelectorAll('[x-show="!userLoggedIn"]');
    guestMenus.forEach((menu) => {
      menu.style.display = "block";
    });

    // Update Alpine.js data if available
    this.updateAlpineData("userLoggedIn", false);
  }

  updateAlpineData(key, value) {
    const alpineComponent = document.querySelector("[x-data]");
    if (alpineComponent && alpineComponent.__x) {
      alpineComponent.__x.$data[key] = value;
    }
  }

  logout() {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user_id");
    this.user = null;
    this.updateUIForLoggedOutUser();
    this.showNotification("Logged out successfully", "success");

    // Redirect to home page
    if (window.location.pathname !== "/index.html" && window.location.pathname !== "/") {
      window.location.href = "index.html";
    }
  }

  // Event Listeners
  setupEventListeners() {
    // Global logout handler
    window.logout = () => this.logout();

    // Form submissions
    this.setupFormHandlers();

    // Navigation active state
    this.updateActiveNavigation();

    // Smooth scrolling
    this.setupSmoothScrolling();

    // Loading state management
    this.setupLoadingStates();
  }

  setupFormHandlers() {
    // Auth forms
    const loginForm = document.querySelector(".form-login");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    const signupForm = document.querySelector(".form-signup");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    }
  }

  updateActiveNavigation() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.includes(currentPage)) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  setupLoadingStates() {
    // Add loading states to buttons
    document.addEventListener("click", (e) => {
      if (e.target.matches(".btn-primary, .btn-secondary")) {
        const button = e.target;
        if (button.dataset.loading !== "false") {
          this.showButtonLoading(button);
        }
      }
    });
  }

  showButtonLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    button.disabled = true;

    // Reset after 3 seconds (adjust based on actual API call)
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 3000);
  }

  // Authentication Handlers
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    try {
      const response = await fetch("/api/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access && data.refresh) {
        const tokens = {
          access: data.access,
          refresh: data.refresh,
        };

        localStorage.setItem("tokens", JSON.stringify(tokens));

        const tokenPayload = this.decodeJWT(data.access);
        localStorage.setItem("user_id", tokenPayload.user_id);

        this.showNotification("Login successful!", "success");

        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        this.showNotification(data.detail || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Network error. Please try again.", "error");
    }
  }

  async handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (!username || !email || !password) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    try {
      const response = await fetch("/api/user/list/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        this.showNotification("Account created successfully!", "success");
        setTimeout(() => {
          window.location.href = "auth.html";
        }, 1500);
      } else {
        const errorData = await response.json();
        this.showNotification(errorData.message || "Registration failed", "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      this.showNotification("Network error. Please try again.", "error");
    }
  }

  // Notification System
  initializeNotifications() {
    this.createNotificationContainer();
  }

  createNotificationContainer() {
    if (document.getElementById("notification-container")) return;

    const container = document.createElement("div");
    container.id = "notification-container";
    container.className = "fixed top-20 right-4 z-50 space-y-2";
    document.body.appendChild(container);
  }

  showNotification(message, type = "info", duration = 5000) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification notification-${type} max-w-sm`;
    notification.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${this.getNotificationIcon(type)}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button onclick="this.parentElement.parentElement.remove()"
                            class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

    container.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }

  getNotificationIcon(type) {
    const icons = {
      success: '<i class="fas fa-check-circle text-green-500"></i>',
      error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
      warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
      info: '<i class="fas fa-info-circle text-blue-500"></i>',
    };
    return icons[type] || icons.info;
  }

  // Data Loading
  async loadUserData() {
    if (!this.user) return;

    try {
      // Load user notifications
      await this.loadNotifications();

      // Load user-specific data
      await this.loadUserPreferences();
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  async loadNotifications() {
    // Implement notification loading from API
    // For now, just set empty array
    this.notifications = [];
    this.updateAlpineData("notifications", this.notifications);
  }

  async loadUserPreferences() {
    // Implement user preferences loading
    // This could include theme, language, etc.
  }

  // Utility Methods
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  // Loading States
  showLoading(element) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if (element) {
      element.classList.add("loading-skeleton");
    }
  }

  hideLoading(element) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if (element) {
      element.classList.remove("loading-skeleton");
    }
  }

  // API Helper
  async apiCall(url, options = {}) {
    const token = localStorage.getItem("tokens");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      const tokens = JSON.parse(token);
      headers.Authorization = `Bearer ${tokens.access}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired, try to refresh or logout
        this.logout();
        throw new Error("Authentication required");
      }

      return response;
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  }
}

// Professional Animation Utilities
class AnimationUtils {
  static fadeIn(element, duration = 300) {
    element.style.opacity = "0";
    element.style.display = "block";

    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;

      element.style.opacity = Math.min(progress, 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  static slideUp(element, duration = 300) {
    element.style.transform = "translateY(20px)";
    element.style.opacity = "0";
    element.style.display = "block";

    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      const easeProgress = this.easeOutCubic(progress);

      element.style.transform = `translateY(${20 * (1 - easeProgress)}px)`;
      element.style.opacity = Math.min(easeProgress, 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.transform = "";
      }
    };

    requestAnimationFrame(animate);
  }

  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

// Initialize the professional system
let recipeHubPro;

document.addEventListener("DOMContentLoaded", () => {
  recipeHubPro = new RecipeHubProfessional();

  // Make it globally available
  window.recipeHubPro = recipeHubPro;
  window.AnimationUtils = AnimationUtils;

  // Setup intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;

        if (element.classList.contains("animate-on-scroll")) {
          element.classList.add("animate-slideUp");
          observer.unobserve(element);
        }
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    observer.observe(el);
  });
});

// Global utility functions
window.showNotification = (message, type, duration) => {
  if (recipeHubPro) {
    recipeHubPro.showNotification(message, type, duration);
  }
};

window.formatDate = (dateString) => {
  if (recipeHubPro) {
    return recipeHubPro.formatDate(dateString);
  }
  return dateString;
};

window.apiCall = (url, options) => {
  if (recipeHubPro) {
    return recipeHubPro.apiCall(url, options);
  }
  return fetch(url, options);
};
