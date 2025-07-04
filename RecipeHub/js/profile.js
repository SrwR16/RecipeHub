const userId = localStorage.getItem("user_id");
var profile_id = 1;
const loadProfile = () => {
  fetch(`/api/chat/profile/`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        if (item.user.id == userId) {
          profile_id = item.id;
          displayProfileContent(item);
        }
      });
    });
};
const displayProfileContent = (item) => {
  document.getElementById("profile-picture").src = item.image || "./assets/banner-a.jpg";
  document.getElementById("username").value = item.user.username;
  document.getElementById("full_name").value = item.full_name;
  document.getElementById("email").value = item.user.email;

  if (item.verified == true) {
    document.getElementById("varification").value = "Verified";
  } else {
    document.getElementById("varification").value = "Not Verified";
  }
  document.getElementById("creation_date").value = item.user_creation_date;
  document.getElementById("user_id").value = item.user.id;
};

const profileUpdate = (event) => {
  event.preventDefault();
  const fullName = document.getElementById("full_name").value;
  const profilePicture = document.querySelector('input[name="profile_picture"]').files[0];
  const formData = new FormData();
  formData.append("full_name", fullName);
  if (profilePicture) {
    formData.append("image", profilePicture);
  }
  fetch(`/api/chat/profile/${profile_id}/`, {
    method: "PATCH",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Profile updated successfully:", data);
      alert("Profile updated successfully!");
      loadProfile();
    })
    .catch((error) => {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    });
};
const navBar = () => {
  const login = document.getElementById("login-control");
  const token = localStorage.getItem("tokens");
  const tokens = JSON.parse(token);
  if (tokens) {
    login.innerHTML = `
      <a onclick="logout()" class="btn text-white" style="background-color: #77574c">Logout</a>
      `;
  } else {
    login.innerHTML = `
      <a href="./auth.html" class="btn text-white" style="background-color: #77574c">Login</a>
      `;
  }
};

const orderShow = () => {
  fetch("/api/order/list/")
    .then((res) => res.json())
    .then((data) =>
      data.forEach((item) => {
        if (item.user == localStorage.getItem("user_id")) {
          displayOrderData(item);
        }
      })
    )
    .catch((error) => console.error("Error fetching orders:", error));
};
const displayOrderData = (item) => {
  const container = document.getElementById("order-list");
  const orderHTML = `
        <div class="bg-base-100 text-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div class="flex flex-col lg:flex-row lg:space-x-12">
                <!-- Pay Reason -->
                <div class="mb-4 lg:mb-0 lg:flex-1">
                    <p class="text-lg font-semibold">Pay Reason:</p>
                    <p class="text-gray-500">${item.pay_reason}</p>
                </div>

                <!-- Payment Date -->
                <div class="mb-4 lg:mb-0 lg:flex-1">
                    <p class="text-lg font-semibold">Payment Date:</p>
                    <p class="text-gray-500">${new Date(item.payment_date).toLocaleString()}</p>
                </div>

                <!-- Payment Status -->
                <div class="mb-4 lg:mb-0 lg:flex-1">
                    <p class="text-lg font-semibold">Payment Status:</p>
                    <p class="text-gray-500">
                        <span class="px-3 py-1 rounded-full ${
                          item.is_payment ? "bg-green-500" : "bg-red-500"
                        } text-white text-sm">
                            ${item.is_payment ? "Paid" : "Unpaid"}
                        </span>
                    </p>
                </div>
                <!-- Payment Amount -->
                <div class="lg:flex-1">
                    <p class="text-lg font-semibold">Payment Amount:</p>
                    <p class="text-gray-500">$${item.payment_amount}</p>
                </div>
            </div>
        </div>
      `;
  container.innerHTML += orderHTML;
};

// Logout function is defined globally in HTML files
navBar();
loadProfile();
orderShow();
