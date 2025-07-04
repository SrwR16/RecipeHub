// Handle user search
document.getElementById("searchForm").addEventListener("submit", function (event) {
  event.preventDefault();
  const group_name = document.getElementById("searchInput").value;
  if (group_name) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("group_name", group_name);

    // Update the URL with the new query parameter
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
    console.log("Searched Group:", group_name);
  }
});
// On page load, get the 'group_name' param from the URL and log it
const urlParams = new URLSearchParams(window.location.search);
const search_group_name = urlParams.get("group_name");
const search_group_name_modified = search_group_name.replace(/\s+/g, "");

const allGroup = () => {
  fetch("/api/chat/group/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ group_name: search_group_name }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Group posted successfully:", data);
    });
};

allGroup();

const setGroupIdLocalStorage = () => {
  fetch("/api/chat/group/")
    .then((res) => res.json())
    .then((data) =>
      data.forEach((item) => {
        if (search_group_name == item.group_name) {
          localStorage.setItem("group", item.id);
        }
      })
    );
};

setGroupIdLocalStorage();

const showMessage = () => {
  fetch("/api/chat/message/")
    .then((res) => res.json())
    .then((data) => {
      const chatMessages = document.getElementById("chatMessages"); // Assuming chatMessages is the container for messages
      chatMessages.innerHTML = ""; // Clear the container first
      data.forEach((item) => {
        if (item.group == localStorage.getItem("group")) {
          displayMsg(item);
        }
      });
      // Scroll to the bottom after all messages are displayed
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
};

showMessage();

const displayMsg = (item) => {
  const chatMessages = document.getElementById("chatMessages");

  // Fetch the user data for the message author
  fetch(`/api/user/list/${item.author}/`)
    .then((res) => res.json())
    .then((userData) => {
      // Fetch the profile to get the user images
      fetch("/api/chat/profile/")
        .then((res) => res.json())
        .then((profiles) => {
          // Find the profile for the message author
          const authorProfile = profiles.find((profile) => profile.user.id == item.author);

          let profileImage = "./assets/card4.jpg"; // Default image if no profile found
          if (authorProfile) {
            profileImage = authorProfile.image; // Use profile image if found
          }

          let messageHTML = ""; // Initialize message HTML

          // Check if the logged-in user is the message author
          if (getUserId() == item.author) {
            messageHTML = `
                <div class="flex justify-end items-center space-x-3 new-message">
                    <div>
                        <div class="text-sm font-semibold text-right text-base-200 px-4">${userData.username}</div>
                        <div class="bg-blue-500 text-white rounded-lg p-4 max-w-xs shadow">
                            <p>${item.body}</p> <!-- Display message content here -->
                        </div>
                    </div>
                    <img src="${profileImage}" alt="${userData.username}" class="w-12 h-12 mt-5 rounded-full" />
                </div>
              `;
          } else {
            messageHTML = `
                <div class="flex justify-start items-center space-x-3 new-message">
                    <img src="${profileImage}" alt="${userData.username}" class="w-11 h-11 mt-5 rounded-full" />
                    <div>
                        <div class="text-sm font-semibold text-left text-base-200 px-4">${userData.username}</div>
                        <div class="bg-gray-200 text-black rounded-lg p-4 max-w-xs shadow">
                            <p>${item.body}</p> <!-- Display message content here -->
                        </div>
                    </div>
                </div>
              `;
          }

          // Append the new message HTML to the chat container
          chatMessages.innerHTML += messageHTML;

          // Scroll to the bottom after new messages are added
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    });
};

var ws = new WebSocket(`ws://localhost:8000/ws/ac/${search_group_name_modified}/`);

ws.onopen = function (event) {
  console.log("Websocket connection open...");
};

ws.onmessage = function (event) {
  const message = JSON.parse(event.data);
  if (message.type === "connection_count") {
    console.log("Current connection count:", message.count);
    document.getElementById("userCount").innerText = `${message.count} Online`;
  }
};

ws.onerror = function (event) {
  console.log("Websocket error occurred...", event);
};
ws.onclose = function (event) {
  console.log("websocket connection closed...", event);
};

const sendButton = document.getElementById("sendButton");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");

// Send button click handler
sendButton.addEventListener("click", () => {
  const messageText = messageInput.value.trim();
  if (messageText) {
    // Message send to the backend
    ws.send(
      JSON.stringify({
        msg: messageText,
      })
    );

    // Save the message to the database
    const group = localStorage.getItem("group");
    const info = {
      group: group,
      author: getUserId(),
      body: messageText,
    };
    fetch("/api/chat/message/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(info),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Message saved to database:", data);
      });

    ws.onmessage = function (event) {
      console.log("Message received from server...", event.data);
      const data = JSON.parse(event.data);
      console.log(data);
      // Create new message element
      const newMessage = document.createElement("div");
      newMessage.classList.add("flex", "justify-end", "new-message");
      newMessage.innerHTML = `
            <div class="bg-blue-500 text-white rounded-lg p-4 max-w-xs shadow">
              <p>${data.msg}</p>
            </div>
          `;
      // Append new message to chat
      chatMessages.appendChild(newMessage);
      // Clear input field
      messageInput.value = "";
    };

    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

const getUser = () => {
  const token = localStorage.getItem("tokens");
  if (token) {
    const tokens = JSON.parse(token);
    const token_seizer = tokens.access.split(".");
    const tokenPayload = JSON.parse(atob(token_seizer[1]));
    //   document.getElementById("username").value = tokenPayload.username;
  } else {
    alert("For Join Chat Room You need login first!");
    window.location.href = "auth.html";
  }
};

// Logout function is defined globally in HTML files

getUser();

const getUserId = () => {
  const user_id = localStorage.getItem("user_id");
  if (user_id) {
    return user_id;
  }
};

getUserId();

const saveMsg = (event) => {
  event.preventDefault();
  const val = document.getElementById("messageInput").value;
};
document.getElementById("sendButton").addEventListener("click", saveMsg);
