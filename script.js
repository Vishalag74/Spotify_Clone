let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongsFromManifest(folder) {
    currFolder = folder;
    let album = songsManifest.albums.find(a => a.folder === folder);
    if (!album) {
        console.error("Album not found in manifest:", folder);
        return [];
    }
    songs = album.songs.map(s => s.filename);

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of album.songs) {
        let displayName = song.title;
        songUL.innerHTML += `<li data-filename="${song.filename}"><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div> ${displayName}</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    // Attach an event listener to each song and its play button
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        // Clicking the list item plays the song
        e.addEventListener("click", element => {
            playMusic(e.dataset.filename);
            // Update all play buttons to play icon
            document.querySelectorAll(".songList .playnow img").forEach(img => {
                img.src = "img/play.svg";
            });
            // Set this play button to pause icon
            let playBtn = e.querySelector(".playnow img");
            if (playBtn) {
                playBtn.src = "img/pause.svg";
            }
            // Update main play button to pause icon
            play.src = "img/pause.svg";
        });
        // Clicking the play button toggles play/pause for that song
        let playBtn = e.querySelector(".playnow img");
        playBtn.addEventListener("click", event => {
            event.stopPropagation(); // Prevent triggering the li click event
            let songFileName = e.dataset.filename;
            let currentSrc = currentSong.src.split("/").slice(-1)[0];
            if (currentSrc === songFileName && !currentSong.paused) {
                currentSong.pause();
                play.src = "img/play.svg";
                playBtn.src = "img/play.svg";
            } else {
                playMusic(songFileName);
                // Update all play buttons to play icon
                document.querySelectorAll(".songList .playnow img").forEach(img => {
                    img.src = "img/play.svg";
                });
                // Set this play button to pause icon
                playBtn.src = "img/pause.svg";
            }
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `songs/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    let displayName = decodeURI(track).replace(/\.mp3$/i, "");
    document.querySelector(".songinfo").innerHTML = displayName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";
    for (const album of songsManifest.albums) {
        cardContainer.innerHTML += ` <div data-folder="${album.folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <img src="${album.cover}" alt="">
            <h2>${album.title}</h2>
            <p>${album.description}</p>
        </div>`;
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongsFromManifest(item.currentTarget.dataset.folder);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    // Load the manifest JSON
    const response = await fetch("songsManifest.json");
    window.songsManifest = await response.json();

    document.querySelector(".homes").addEventListener("click", () => {
        location.reload();
    });

    function toggleSearch() {
        var searchBox = document.getElementById("searchBox");
        if (searchBox.style.display === "none") {
            searchBox.style.display = "block";
            document.querySelector(".search-box").style.display = "none";
        } else {
            searchBox.style.display = "none";
            document.querySelector(".search-box").style.display = "block";
        }
    }

    document.querySelector(".search-box").addEventListener("click", () => {
        toggleSearch();
    });

    // Add search functionality
    const searchInput = document.getElementById("searchBox");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const songItems = document.querySelectorAll(".songList ul li");
            songItems.forEach(item => {
                const infoDiv = item.querySelector(".info div");
                if (infoDiv) {
                    const songName = infoDiv.textContent.toLowerCase();
                    if (songName.includes(query)) {
                        item.style.display = "";
                    } else {
                        item.style.display = "none";
                    }
                }
            });
        });
    }

    // Get the list of all the songs from the first album in the manifest
    if (window.songsManifest.albums.length > 0) {
        songs = await getSongsFromManifest(window.songsManifest.albums[0].folder);
        playMusic(songs[0], true);
    }

    // Display all the albums on the page
    await displayAlbums();

    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
            // Update song list play button icon to pause for current song
            updateSongListPlayButton(true);
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
            // Update song list play button icon to play for current song
            updateSongListPlayButton(false);
        }
    });

    // Function to update the play button icon in the song list for the current song
    function updateSongListPlayButton(isPlaying) {
        let currentSrc = currentSong.src.split("/").slice(-1)[0];
        document.querySelectorAll(".songList li").forEach(li => {
            let playBtn = li.querySelector(".playnow img");
            if (li.dataset.filename === currentSrc) {
                playBtn.src = isPlaying ? "img/pause.svg" : "img/play.svg";
            } else {
                playBtn.src = "img/play.svg";
            }
        });
    }

    // Change circle color on play event only, do not revert on pause
    currentSong.addEventListener("play", () => {
        document.querySelector(".circle").style.backgroundColor = "red";
        updatePlayPauseIcons(true);
    });

    currentSong.addEventListener("pause", () => {
        updatePlayPauseIcons(false);
    });

    currentSong.addEventListener("ended", () => {
        let currentIndex = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        let nextIndex = (currentIndex + 1) % songs.length;
        playMusic(songs[nextIndex]);
        updatePlayPauseIcons(true);
    });

    // Function to update play/pause icons in song list and main play button
    function updatePlayPauseIcons(isPlaying) {
        let currentSrc = currentSong.src.split("/").slice(-1)[0];
        document.querySelectorAll(".songList li").forEach(li => {
            let playBtn = li.querySelector(".playnow img");
            if (li.dataset.filename === currentSrc) {
                playBtn.src = isPlaying ? "img/pause.svg" : "img/play.svg";
            } else {
                playBtn.src = "img/play.svg";
            }
        });
        play.src = isPlaying ? "img/pause.svg" : "img/play.svg";
    }

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        let progressPercent = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = progressPercent + "%";
        // Add red color to the left of the circle on the seekbar using linear-gradient background
        document.querySelector(".seekbar").style.background = `linear-gradient(to right, red 0%, red ${progressPercent}%, #ccc ${progressPercent}%, #ccc 100%)`;
    });

    // Listen for ended event to play next song or loop to first
    currentSong.addEventListener("ended", () => {
        let currentIndex = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        let nextIndex = (currentIndex + 1) % songs.length;
        playMusic(songs[nextIndex]);
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        // Update the seekbar background to show red color to the left of the circle
        document.querySelector(".seekbar").style.background = `linear-gradient(to right, red 0%, red ${percent}%, #ccc ${percent}%, #ccc 100%)`;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        let prevIndex = (index - 1 + songs.length) % songs.length;
        playMusic(songs[prevIndex]);
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        let nextIndex = (index + 1) % songs.length;
        playMusic(songs[nextIndex]);
    });

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();
