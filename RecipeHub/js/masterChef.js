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

const loadChef = (event) => {
  event.preventDefault();
  const humanPrompt = document.getElementById("humanText").value;
  const info = {
    text: humanPrompt,
    user: localStorage.getItem("user_id"),
  };

  fetch("/api/ai/chef/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(info),
  })
    .then((res) => res.json())
    .then((data) => {
      displayResponse(data); // Display the AI response
      saveTheResponseTotheModel(data); // Save the response separately
    });
};

const displayResponse = (data) => {
  // Display the AI response in the UI
  document.getElementById("ai_response").innerText = `
    ${data.ai_response}
  `;
};

function saveTheResponseTotheModel(data) {
  const info_response = {
    instance_human: data.instance,
    ai_response: data.ai_response,
  };

  fetch("/api/ai/response/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(info_response),
  })
    .then((res) => res.json())
    .then((response) => {
      // Optional: Log saved response confirmation
      console.log("Response saved successfully:", response);
    })
    .catch((error) => {
      console.error("Error saving the response:", error);
    });
}

// Load Conversations for Chatting App
async function loadConversations() {
  try {
    const response = await fetch("/api/ai/response/");
    if (!response.ok) throw new Error("Failed to fetch conversations");

    const data = await response.json();

    // Get logged-in user ID from localStorage
    const humanTextList = document.getElementById("humanTextList");

    // Clear existing items
    humanTextList.innerHTML = "";

    // Filter and display human texts for the logged-in user
    data.forEach((conversation) => {
      const { instance_human, ai_response } = conversation;

      // Check if the logged-in user matches
      console.log(instance_human.user);
      if (instance_human.user === parseInt(localStorage.getItem("user_id"))) {
        const li = document.createElement("li");
        li.className = "p-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer";
        if (conversation.instance_human.user == localStorage.getItem("user_id")) {
          li.textContent = instance_human.text;
        }

        // Attach the AI response to the `onclick` event
        li.onclick = () => openModal(ai_response);

        // Append to the list
        humanTextList.appendChild(li);
      }
    });
  } catch (error) {
    console.error("Error loading conversations:", error);
  }
}

// Open Modal to Display AI Response
function openModal(aiResponse) {
  const modal = document.getElementById("responseModal");
  const modalContent = document.getElementById("modalContent");

  // Set AI response in modal content
  modalContent.textContent = aiResponse;

  // Show the modal by removing the "hidden" class
  modal.classList.remove("hidden");
}

// Close Modal
function closeModal() {
  const modal = document.getElementById("responseModal");
  modal.classList.add("hidden");
}

loadConversations();
navBar();
