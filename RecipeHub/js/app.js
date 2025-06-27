const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

const loadBanner = () => {
  fetch(`http://127.0.0.1:8000/banner/title/?id=${id}`)
    .then((res) => res.json())
    .then((data) => displayBanner(data))
    .catch((error) => console.error("Error fetching banner data:", error));
};

const displayBanner = (data) => {
  const parent = document.getElementById("banner-title");
  parent.innerHTML = ""; // Clear previous content
  const div = document.createElement("div");
  div.innerHTML = `
      <h1 class="text-3xl py-4"><a href="#">${data[0].title}</a></h1>
      <div>
          <p class="lg:pb-12 pb-5 lg:relative leading-/6 sm:w-full" style="font-size: 17px">
              ${data[0].description}
          </p>
          <button class="lg:absolute lg:top-52 lg:start-14 primary-color px-3 py-2 text-white rounded">
              Top 20 summer comfort food recipes
          </button>
      </div>
    `;
  parent.appendChild(div);
};

// IIFE - immediately Invoked Function Expression
(function () {
  fetch("http://127.0.0.1:8000/banner/title/")
    .then((res) => res.json())
    .then((data) => {
      if (data.length > 0) {
        const ids = data.map((item) => item.id);

        // Select a random id from the list of ids
        const randomIndex = Math.floor(Math.random() * data.length);
        const selectItems = data[randomIndex];
        const randomlySelectedIdFromExistingObject = selectItems.id;

        // set this random existing id to the url as a parameter.
        const newUrl = new URL(window.location);
        newUrl.searchParams.set("id", randomlySelectedIdFromExistingObject);
        window.history.pushState({}, "", newUrl);
      }
    });
})();

const promotion = () => {
  fetch("http://127.0.0.1:8000/promotions/list/")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        displayPromotion(item);
      });
    });
};

const displayPromotion = (item) => {
  const parent = document.getElementById("promotion");
  const div = document.createElement("div");

  const title = item.title.split(" ").slice(0, 3).join(" ");
  const description = item.description.split(" ").slice(0, 6).join(" ");

  div.classList.add("w-full", "h-full", "promotion", "bg-base-100", "p-4");
  div.innerHTML = ` 
    <div class="w-full h-full relative">
      <div class="w-full h-48 overflow-hidden">
        <img src="${item.image}" alt="" class="w-full h-full object-cover" />
      </div>
      <h1 class="heading text-xl text-center font-semibold mt-4">${title}</h1>
      <p class="description text-center mt-2">${description}</p>
      <a onclick="sendingIDtoorderPage(${item.id})"><button class="btn-neutral primary-color w-full mt-4 h-10">Order here</button></a>
    </div>
  `;

  parent.appendChild(div);
};

const podcast = () => {
  fetch("http://127.0.0.1:8000/podcast/episode/list/normal/")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item, index) => {
        displayPodcast(item, index);
      });
    });
};

const displayPodcast = (item, index) => {
  const podcastEp = document.getElementById("podcast-episode");
  const div = document.createElement("div");
  div.classList.add("podcast-item");

  div.innerHTML = `
        <audio class="hidden" id="audio${index}" src="${item.audio}" controls></audio>
        <div id="playPauseButton${index}" class="flex items-center text-white cursor-pointer mb-4 w-full justify-start" onclick="togglePlayPause(${index})">
        <i id="playPauseIcon${index}" class="fa-solid fa-play mr-2"></i>
        <p>${item.title}</p>
        </div>
  `;
  podcastEp.appendChild(div);
};

const togglePlayPause = (index) => {
  const audio = document.getElementById(`audio${index}`);
  const icon = document.getElementById(`playPauseIcon${index}`);
  if (audio.paused) {
    audio.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  } else {
    audio.pause();
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
  }
};

const sendingIDtoorderPage = (orderProductID) => {
  const orderURL = `promitonOrder.html?id=${orderProductID}`;
  window.location.href = orderURL;
};

const fetchPodcastData = () => {
  fetch("http://127.0.0.1:8000/podcast/premium/")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((podcast) => {
        createPodcastCard(podcast);
      });
    })
    .catch((error) => console.error("Error fetching podcast data:", error));
};

const verificationCheck = async () => {
  const res = await fetch("http://127.0.0.1:8000/chat/profile/");
  const data = await res.json();
  const userId = localStorage.getItem("user_id");
  const userProfile = data.find(item => item.user.id == userId);
  if (userProfile) {
    return userProfile.verified;
  }
  return false;
};

const createPodcastCard = async (podcast) => {
  const container = document.getElementById("podcast-container");
  const isVerified = await verificationCheck();
  const listenUrl = isVerified ? `podcast.html?podcast_id=${podcast.id}` : "subscription.html";
  const cardHTML = `
    <div class="card w-80 h-80 bg-base-100 shadow-xl image-full relative">
      <figure class="w-full h-full">
        <img src="${podcast.image}" alt="${podcast.name}" class="object-cover w-full h-full" />
      </figure>
      <div class="card-body flex flex-col justify-end relative">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <i class="fas fa-microphone text-white text-6xl"></i>
        </div>
        <h2 class="card-title z-10">${podcast.name}</h2>
        <div class="card-actions mt-auto z-10">
          <button class="btn">
            <span class="listen-button">
              <a href="${listenUrl}" target="_blank">Listen</a>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  container.innerHTML += cardHTML;
};

// Fetch the podcast data when the page loads
document.addEventListener("DOMContentLoaded", fetchPodcastData);

promotion();
loadBanner();
podcast();
