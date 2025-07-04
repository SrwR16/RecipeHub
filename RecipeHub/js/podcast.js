const urlParams = new URLSearchParams(window.location.search);
const podcast_id = urlParams.get("podcast_id");

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

const loadPodcast = () => {
  fetch(`/api/podcast/premium/${podcast_id}`)
    .then((res) => res.json())
    .then((data) => displayPodcastPremium(data));
};

const displayPodcastPremium = (data) => {
  console.log(data);
  const podcastContainer = document.querySelector("#podcast-container");
  podcastContainer.innerHTML = `
        <div class="flex items-center space-x-4">
            <img src="${data.image}" alt="Podcast Logo" class="w-96 h-96">
            <div>
                <h1 class="text-3xl font-bold">${data.name}</h1>
                <p class="text-gray-500">${data.description}</p>
                <p class="text-gray-900">${data.keyword}</p>
                <button class="mt-2 px-4 py-2 primary-color hover:bg-gray-700 rounded-full text-white">Latest Episode</button>
            </div>
        </div>
    `;
};
loadPodcast();

const loadEpisode = () => {
  fetch("/api/podcast/episode/list/premium/")
    .then((res) => res.json())
    .then((data) =>
      data.forEach((item) => {
        if (item.podcast == podcast_id) {
          displayEp(item);
        }
      })
    );
};
const displayEp = (episode) => {
  const episodesContainer = document.getElementById("episodes-container");
  const episodeCard = document.createElement("div");
  episodeCard.className = "flex items-start bg-gray-800 p-4 rounded-lg shadow-md mb-6";
  episodeCard.innerHTML = `
        <img src="${episode.image}" alt="Episode Thumbnail" class="w-24 h-32 mr-4">
        <div>
            <h2 class="text-xl font-semibold text-white">${episode.title}</h2>
            <p class="text-gray-400">By ${episode.author_name}</p>
            <p class="text-gray-400">${episode.episode_time}</p>
            <audio class="hidden" id="audio${episode.id}" src="${episode.audio}" controls></audio>
            <div id="playPauseButton${episode.id}" class="flex items-center text-white cursor-pointer pt-4 w-full justify-start" onclick="togglePlayPause(${episode.id})">
                <i id="playPauseIcon${episode.id}" class="fa-solid fa-play mr-2"></i>
            </div>
        </div>
    `;
  episodesContainer.appendChild(episodeCard);
};
const togglePlayPause = (id) => {
  const audio = document.getElementById(`audio${id}`);
  const playPauseIcon = document.getElementById(`playPauseIcon${id}`);
  if (audio.paused) {
    audio.play();
    playPauseIcon.classList.remove("fa-play");
    playPauseIcon.classList.add("fa-pause");
  } else {
    audio.pause();
    playPauseIcon.classList.remove("fa-pause");
    playPauseIcon.classList.add("fa-play");
  }
};
window.onload = loadEpisode;

// Logout function is defined globally in HTML files
navBar();
