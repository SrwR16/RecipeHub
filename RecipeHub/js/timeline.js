const getUser = () => {
  const token = localStorage.getItem("tokens");
  if (token) {
    const tokens = JSON.parse(token);
    const token_seizer = tokens.access.split(".");
    const tokenPayload = JSON.parse(atob(token_seizer[1]));
  } else {
    alert("Are you authenticate? You have logIn first!");
    window.location.href = "auth.html";
  }
};

const ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/`);

ws.onopen = function (event) {
  console.log("Websocket connection open...");
};
ws.onerror = function (event) {
  console.log("Websocket error occurred...", event);
};
ws.onclose = function (event) {
  console.log("websocket connection closed...", event);
};

let notificationCount = 0;
const notificationIcon = document.getElementById("notification-icon");
const notificationDropdown = document.getElementById("notification-dropdown");
const notificationList = document.getElementById("notification-list");

document.addEventListener("DOMContentLoaded", () => {
  const notificationIcon = document.getElementById("notification-icon");
  const notificationDropdown = document.getElementById("notification-dropdown");

  // Toggle dropdown visibility when the icon is clicked
  notificationIcon.addEventListener("click", () => {
    notificationDropdown.classList.toggle("hidden");
  });
});

// Update notification badge and add to the dropdown list
function updateNotificationBadge(count) {
  const badge = document.querySelector(".notification-badge");

  if (!badge) {
    const badgeElement = document.createElement("span");
    badgeElement.className = "badge badge-xs notification-badge indicator-item";
    badgeElement.style.backgroundColor = "#77574c";
    badgeElement.style.color = "white";
    badgeElement.textContent = count;
    notificationIcon.appendChild(badgeElement);
  } else {
    badge.textContent = count;
  }
}

// Add a new message to the notification dropdown
function addNotificationMessage(message) {
  const notificationItem = document.createElement("li");
  notificationItem.className = "p-2 border-b";
  notificationItem.innerHTML = `
        <p class="text-xs text-gray-600 font-semibold">${message}</p>
    `;
  notificationList.appendChild(notificationItem);
}

// WebSocket onmessage function
ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  if (data["to_userId"] == localStorage.getItem("user_id")) {
    notificationCount += 1;
    updateNotificationBadge(notificationCount);
    console.log(data["message"]);
    // Add message to notification dropdown
    addNotificationMessage(data["message"]);
  }
};

// Function to check if the user has already liked the recipe
const checkIfUserLiked = async (recipeId) => {
  const from_userId = localStorage.getItem("user_id");

  try {
    const res = await fetch("http://127.0.0.1:8000/comment/react/list/");
    const data = await res.json();

    // Check if this user has already liked the recipe
    const userHasLiked = data.some((reaction) => reaction.user == from_userId && reaction.recipe == recipeId);
    return userHasLiked;
  } catch (error) {
    console.error("Error fetching reaction data:", error);
    return false;
  }
};

const toggleReaction = async (recipeId, to_userId) => {
  const from_userId = localStorage.getItem("user_id");

  // Check if the user has already liked the recipe
  const userHasLiked = await checkIfUserLiked(recipeId);

  if (userHasLiked) {
    alert("You have already liked this recipe!");
    return;
  }
  ws.send(
    JSON.stringify({
      recipe_id: recipeId,
      to_userId: to_userId,
      from_userId: from_userId,
    })
  );

  // After the reaction, update the button state
  const likeButton = document.getElementById(`like-button-${recipeId}`);
  if (likeButton) {
    likeButton.innerHTML = `<i class="fas fa-thumbs-up mr-1"></i> Liked`;
    likeButton.disabled = true; // Disable the button
  } else {
    console.error("Like button element not found!");
  }
};

function toggleComments(button, recipeID) {
  const commentsSection = button.closest(".bg-white").querySelector(".comment-section"); // This now works
  const isHidden = commentsSection.classList.contains("hidden");

  // Toggle visibility of the comments section
  commentsSection.classList.toggle("hidden");

  // Only fetch comments if the section is being opened
  if (isHidden) {
    console.log("Recipe ID:", recipeID);
    fetch("http://127.0.0.1:8000/comment/list/")
      .then((res) => res.json())
      .then((data) => {
        // Clear previous comments (if any)
        commentsSection.innerHTML = ""; // Clear existing comments

        // Filter and display comments for the specific recipe
        data.forEach((item) => {
          if (recipeID == item.recipe) {
            console.log(item);
            const commentHTML = `
                    <div id="comment-${item.id}" class="bg-gray-100 p-2 rounded-lg">
                        <div class="flex justify-between">
                            <span class="font-semibold">${item.username}</span>
                            <span class="text-gray-500 text-sm">${new Date(item.creation_date).toLocaleString()}</span>
                            <button class="text-red-500 hover:text-red-700" onclick="deleteComment(${item.id})">
                                ${item.user == localStorage.getItem("user_id") ? '<i class="fas fa-trash"></i>' : " "}
                            </button>
                        </div>
                        <p class="mt-1">${item.comment_text}</p>
                    </div>
                `;
            // Append the comment to the comments section
            commentsSection.insertAdjacentHTML("beforeend", commentHTML);
          }
        });
      })
      .catch((err) => console.error("Error fetching comments:", err));
  }
}

async function fetchGroups() {
  try {
    const response = await fetch("http://127.0.0.1:8000/chat/group/");
    if (!response.ok) throw new Error("Network response was not ok");
    const groups = await response.json();

    // Get the group list element
    const groupList = document.getElementById("group-list");

    // Clear existing items
    groupList.innerHTML = "";

    // Populate the group list
    groups.forEach((group) => {
        // console.log(group);
      const li = document.createElement("li");
      li.className = "border-b pb-2";

      const anchor = document.createElement("a");
      anchor.href = `http://127.0.0.1:5501/chat.html?group_name=${encodeURIComponent(group.group_name)}`;
      user_id = localStorage.getItem("user_id")
      if(group.user == user_id){
        console.log(user_id);
        anchor.textContent = group.group_name;
        anchor.className = "text-gray-800 hover:underline";
        li.appendChild(anchor);
        groupList.appendChild(li);
      }

    });
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

// Function to add a new group
async function addGroup() {
  const groupInput = document.getElementById("group-input");
  const groupName = groupInput.value.trim();
  const user = localStorage.getItem('user_id')
  if (groupName) {
    try {
      const response = await fetch("http://127.0.0.1:8000/chat/group/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user:user, group_name: groupName }), // Adjust this structure according to your API's expectations
      });

      if (!response.ok) throw new Error("Failed to add group");

      // Clear the input field
      groupInput.value = "";

      // Fetch and update the group list
      fetchGroups();
    } catch (error) {
      console.error("There was a problem with adding the group:", error);
    }
  } else {
    alert("Please enter a group name");
  }
}
document.getElementById("add-group-btn").addEventListener("click", addGroup);
window.onload = fetchGroups; // Fetch groups on page load

// For post to server...

document.addEventListener("DOMContentLoaded", () => {
  const postForm = document.getElementById("postForm");
  postForm.addEventListener("submit", postSubmit);
});

const postSubmit = (event) => {
  event.preventDefault();

  // Collecting input values
  const title = document.querySelector('input[placeholder="Enter title"]').value;
  const content = document.querySelector('textarea[placeholder="What\'s on your mind?"]').value;
  const flavor = document.querySelector('input[placeholder="Enter flavor"]').value;
  const region = document.querySelector('input[placeholder="Enter region"]').value;
  const season = document.getElementById('season').value;

  // Collecting files
  const imageInput = document.querySelector('input[type="file"][accept="image/*"]');
  const videoInput = document.querySelector('input[type="file"][accept="video/*"]');
  const formData = new FormData();

  const userId = localStorage.getItem("user_id");
  formData.append("user", userId);
  formData.append("title", title);
  formData.append("ingredients", content);
  formData.append("flavour", flavor);
  formData.append("region", region);
  formData.append("seasonal", season);

  // Adding files to FormData if they exist
  if (imageInput.files.length > 0) {
    formData.append("media", imageInput.files[0]);
  }
  if (videoInput.files.length > 0) {
    formData.append("media", videoInput.files[0]);
  }

  try {
    fetch("http://127.0.0.1:8000/kitchen/post/", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        alert("Post created successfully!");
      })
      .catch((error) => {
        console.error("Error posting data:", error);
        alert("There was a problem with the information!");
      });
  } catch (error) {
    console.error("Error posting data:", error);
    alert("There was a problem with the information!");
  }
};

// For post to view in timeline
const allPost = () => {
  fetch("http://127.0.0.1:8000/kitchen/post/")
    .then((res) => res.json())
    .then((data) => data.forEach((item) => displayPost(item)))
    .catch((err) => console.error("Error fetching posts:", err));
};

const displayPost = (item) => {
  const postContainer = document.getElementById("post-container");

  const postElement = document.createElement("div");
  postElement.classList.add("bg-white", "shadow-md", "rounded-lg", "p-4", "mb-4", "transition", "hover:shadow-lg");

  // Post creation date converted to relative time or string format
  const creationDate = new Date(item.creation_date).toLocaleString();

  postElement.innerHTML = `
          <div class="flex items-center justify-between">
              <h2 class="font-bold">${item.username}</h2>
              <span class="text-gray-500 text-sm">${creationDate}</span>
          </div>
  
          <h1 class="mt-2 text-2xl font-semibold text-gray-800">${item.title}</h1>
          <p class="mt-4 font-light text-gray-600 leading-relaxed">${item.ingredients}</p>
          
          <div class="mt-4">
              <p class="font-medium text-gray-800">Flavour: <a href="#" class="hover:underline">${item.flavour}</a></p>
              <p class="font-medium text-gray-800">Region: <a href="#" class="hover:underline">${item.region}</a></p>
              <p class="font-medium text-gray-800">Season: <a href="#" class="hover:underline">${item.seasonal}</a></p>
          </div>
          <img src="${item.media}" alt="Post Image" class="post-image w-full rounded-lg mt-2" />

  
        <!-- Action Buttons -->
          <div class="mt-4 flex justify-between text-gray-600 space-x-0">

        <!-- Working here -->
        
            <button id="like-button-${item.id}" class="flex items-center hover:text-gray-800 transition primary-text-color" onclick="toggleReaction(${item.id}, ${item.user})">
                <i class="fas fa-thumbs-up mr-1"></i> Like
            </button>
        
        <!-- To here -->


            <button class="flex items-center hover:text-gray-800 transition" onclick="toggleComments(this, ${item.id})">
                <i class="fas fa-comment-dots mr-1"></i> Comment
            </button>
          </div>
  
          <!-- Comments Section -->
          <div class="comment-section mt-4 space-y-2 hidden">
              <!-- Comments will be appended here -->
          </div>
  
          <!-- Comment Input Field -->
          <div class="flex mt-2">
              <input id="comment-text-${item.id}" type="text" placeholder="Write a comment..." class="w-full p-2 border border-gray-300 rounded-lg" />
              <button class="ml-2 text-white primary-color px-4 rounded-lg hover:text-gray-800 transition" onclick="postComment(${item.id})">Post</button>
          </div>
      `;

  // Append the post element to the container
  postContainer.appendChild(postElement);
};

// Fetch all posts when the page loads
document.addEventListener("DOMContentLoaded", allPost);

// Comment post..
function postComment(recipeID) {
  console.log(recipeID);
  const commentText = document.getElementById(`comment-text-${recipeID}`);
  const user = localStorage.getItem("user_id");
  const image = null;
  console.log(commentText);
  const commentData = {
    user: user,
    comment_text: commentText.value,
    image: image,
    recipe: recipeID,
  };

  fetch("http://127.0.0.1:8000/comment/list/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentData),
  })
    .then((res) => res.json())
    .then((data) => (commentText.value = ""));
}

const deleteComment = (commentID) => {
  fetch(`http://127.0.0.1:8000/comment/list/${commentID}/`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
  }).then((res) => {
    if (res.status === 204) {
      alert("Comment deleted successfully");
    } else {
      console.log("Failed to delete Comment");
    }
  });
};

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

const logout = () => {
  alert("Logout Successfully");
  localStorage.removeItem("tokens");
  localStorage.removeItem("user_id");
  window.location.href = "auth.html";
};

const userPost = (id) => {
  console.log("helloooooo", id);
};

navBar();
getUser();
