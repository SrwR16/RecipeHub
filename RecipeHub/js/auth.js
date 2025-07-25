const switchers = [...document.querySelectorAll(".switcher")];
switchers.forEach((item) => {
  item.addEventListener("click", function () {
    switchers.forEach((item) => item.parentElement.classList.remove("is-active"));
    this.parentElement.classList.add("is-active");
  });
});

const navBar = () => {
  const login = document.getElementById("login-control");
  if (!login) return;

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

document.addEventListener("DOMContentLoaded", () => {
  navBar();

  const signupForm = document.querySelector(".form-signup");
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = document.getElementById("signup-username").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;

      console.log("Form values:", { username, email, password });

      const userData = {
        username: username,
        email: email,
        password: password,
      };

      console.log("Sending userData:", userData);

      fetch("/api/user/list/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
        .then((response) => {
          console.log("Response status:", response.status);
          if (!response.ok) {
            return response.json().then((errorData) => {
              console.log("Error response:", errorData);
              throw new Error("Network response was not ok");
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Success response:", data);
          alert("Sign Up Successful!");
          window.location.href = "auth.html";
        })
        .catch((error) => {
          console.error("Registration error:", error);
        });
    });
  }
});

const login = (event) => {
  event.preventDefault();
  const email = getValue("email");
  const password = getValue("password");
  const info = {
    email,
    password,
  };
  fetch("/api/auth/token/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(info),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.access && data.refresh) {
        const tokens = {
          access: data.access,
          refresh: data.refresh,
        };
        localStorage.setItem("tokens", JSON.stringify(tokens));
        const token_seizer = data.access.split(".");
        const tokenPayload = JSON.parse(atob(token_seizer[1]));
        localStorage.setItem("user_id", tokenPayload.user_id);
        console.log(tokenPayload.username);
        alert("Login Successfully!");

        // Start token refresh mechanism
        startTokenUpdater();

        window.location.href = "index.html";
      } else {
        throw new Error("Access or refresh token missing in the response");
      }
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    });
};

const getToken = () => {
  const token = localStorage.getItem("tokens");
  const tokens = JSON.parse(token);
  return tokens ? tokens.refresh : null;
};

const updateToken = (refresh) => {
  const info = {
    refresh,
  };
  fetch("/api/auth/token/refresh/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(info),
  })
    .then((res) => {
      if (res.status === 401) {
        // Token is invalid, clear storage and stop refresh attempts
        console.log("Refresh token expired, clearing storage");
        localStorage.removeItem("tokens");
        localStorage.removeItem("user_id");
        stopTokenUpdater();
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (data && data.access && data.refresh) {
        const tokens = {
          access: data.access,
          refresh: data.refresh,
        };
        localStorage.setItem("tokens", JSON.stringify(tokens));
        const token_seizer = data.access.split(".");
        const tokenPayload = JSON.parse(atob(token_seizer[1]));
        console.log(tokenPayload.username);
      }
    })
    .catch((error) => {
      console.error("Token refresh error:", error);
      // Clear tokens on error and stop refresh attempts
      localStorage.removeItem("tokens");
      localStorage.removeItem("user_id");
      stopTokenUpdater();
    });
};

let tokenRefreshInterval = null;

const startTokenUpdater = () => {
  // Only start if not already running and we have a token
  if (!tokenRefreshInterval && localStorage.getItem("tokens")) {
    tokenRefreshInterval = setInterval(() => {
      const refresh = getToken();
      if (refresh) {
        updateToken(refresh);
      } else {
        stopTokenUpdater();
      }
    }, 30000); // Refresh every 30 seconds instead of 2 seconds
  }
};

const stopTokenUpdater = () => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

// Start token updater if user is logged in
if (localStorage.getItem("tokens")) {
  startTokenUpdater();
}

const getValue = (id) => {
  const value = document.getElementById(id).value;
  return value;
};

// Logout function is defined globally in HTML files
