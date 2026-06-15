// js/game.js
import { audio, isPlaying, queue, queueIndex, playActiveSong, setQueue } from "./audio.js";
import { state } from "./var.js";

let currentGameSong = null;
let currentOptions = [];
let currentCorrectAnswer = "";
let currentRoundActive = true;
let score = 0;
let previousSongId = null;
let fragmentTimeout = null;
let wasPlayingBeforeGame = false;
let previousQueue = null;
let previousQueueIndex = null;
let audioCtx = null;

let gameCover, gameScore, gameOptionsContainer, gameNextBtn, gameMessage, gamePlayingIndicator;

let currentPlayPromise = null;

export function initGameDOM() {
  gameCover = document.getElementById("gameCover");
  gameScore = document.getElementById("gameScore");
  gameOptionsContainer = document.getElementById("gameOptions");
  gameNextBtn = document.getElementById("gameNextBtn");
  gameMessage = document.getElementById("gameMessage");
  gamePlayingIndicator = document.getElementById("gamePlayingIndicator");

  if (gameNextBtn) {
    gameNextBtn.addEventListener("click", () => nextRound());
  }
}

function playBeep(type) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  let frequency = type === "correct" ? 880 : 440;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
  osc.start();
  osc.stop(now + 0.3);
}

function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#a855f7", "#c084fc", "#e0b0ff"] });
  }
}

export function startGame() {
  if (isPlaying) {
    wasPlayingBeforeGame = true;
    audio.pause();
  } else {
    wasPlayingBeforeGame = false;
  }
  previousQueue = [...queue];
  previousQueueIndex = queueIndex;
  score = 0;
  updateScore();
  loadNewRound();
}

export function stopGame() {
  if (fragmentTimeout) clearTimeout(fragmentTimeout);
  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  if (wasPlayingBeforeGame && previousQueue && previousQueue.length > 0) {
    setQueue(previousQueue, previousQueueIndex);
    playActiveSong();
  }
}

async function loadNewRound() {
  const container = document.querySelector(".game-container");
  if (container) container.style.opacity = "0";
  setTimeout(async () => {
    if (gameMessage) {
      gameMessage.innerText = "";
      gameMessage.className = "";
    }
    enableOptions(true);
    if (gameNextBtn) gameNextBtn.disabled = false;
    currentRoundActive = true;

    // Obtener canciones desde los datos globales cargados por la API
    const albums = window.albumsFromDB || [];
    let allSongs = [];

    albums.forEach((album) => {
      if (album.songs && Array.isArray(album.songs)) {
        album.songs.forEach((song) => {
          allSongs.push({
            ...song,
            trackTitle: song.trackTitle,
            file: song.file || song.archivo_url, // compatibilidad con API
            artistName: song.artistName || album.artist,
            albumCover: song.albumCover || album.cover,
            albumTitle: album.title,
          });
        });
      }
    });

    // Añadir canciones importadas por el usuario (state.importedSongs viene de API)
    if (state.importedSongs && Array.isArray(state.importedSongs)) {
      state.importedSongs.forEach((song) => {
        allSongs.push({
          ...song,
          trackTitle: song.trackTitle,
          file: song.file || song.archivo_url,
          artistName: song.artistName || "Importado",
          albumCover: song.albumCover || "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
        });
      });
    }

    if (allSongs.length === 0) {
      if (gameMessage) gameMessage.innerText = "No hay canciones. Importa alguna.";
      if (container) container.style.opacity = "1";
      return;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * allSongs.length);
    } while (previousSongId === allSongs[randomIndex].file && allSongs.length > 1);

    currentGameSong = allSongs[randomIndex];
    previousSongId = currentGameSong.file;
    currentCorrectAnswer = currentGameSong.trackTitle;

    if (gameCover) {
      gameCover.src = currentGameSong.albumCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
    }

    let incorrectOptions = [];
    const otherSongs = allSongs.filter((s) => s.file !== currentGameSong.file);
    for (let i = 0; i < 2 && otherSongs.length > 0; i++) {
      const rand = Math.floor(Math.random() * otherSongs.length);
      incorrectOptions.push(otherSongs[rand].trackTitle);
      otherSongs.splice(rand, 1);
    }
    while (incorrectOptions.length < 2) incorrectOptions.push("???");
    currentOptions = [currentCorrectAnswer, ...incorrectOptions];
    for (let i = currentOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentOptions[i], currentOptions[j]] = [currentOptions[j], currentOptions[i]];
    }

    renderOptions();
    await playFragment();

    if (container) container.style.opacity = "1";
  }, 200);
}

function renderOptions() {
  if (!gameOptionsContainer) return;
  gameOptionsContainer.innerHTML = "";
  currentOptions.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "game-option-btn";
    btn.innerText = option;
    btn.addEventListener("click", () => checkAnswer(btn, option));
    gameOptionsContainer.appendChild(btn);
  });
}

async function playFragment() {
  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (e) {}
    currentPlayPromise = null;
  }

  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  audio.src = currentGameSong.file;
  audio.currentTime = 0;

  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
    currentPlayPromise = null;
    if (gamePlayingIndicator) gamePlayingIndicator.style.display = "flex";

    if (fragmentTimeout) clearTimeout(fragmentTimeout);
    fragmentTimeout = setTimeout(() => {
      if (!audio.paused) audio.pause();
      if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
    }, 10000);
    audio.addEventListener("timeupdate", stopFragment);
  } catch (err) {
    console.warn("Error al reproducir fragmento:", err);
    currentPlayPromise = null;
    if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
  }
}

function stopFragment() {
  if (audio.currentTime >= 10) {
    if (currentPlayPromise) {
      currentPlayPromise
        .then(() => {
          audio.pause();
          cleanup();
        })
        .catch(() => cleanup());
    } else {
      audio.pause();
      cleanup();
    }
    function cleanup() {
      if (fragmentTimeout) clearTimeout(fragmentTimeout);
      if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
      audio.removeEventListener("timeupdate", stopFragment);
    }
  }
}

function checkAnswer(btn, selected) {
  if (!currentRoundActive) return;
  currentRoundActive = false;
  enableOptions(false);

  const isCorrect = selected === currentCorrectAnswer;
  if (isCorrect) {
    score++;
    updateScore();
    btn.classList.add("correct");
    if (gameMessage) {
      gameMessage.innerText = "✅ ¡Correcto!";
      gameMessage.classList.add("correct-msg");
    }
    playBeep("correct");
    launchConfetti();
  } else {
    btn.classList.add("incorrect");
    const btns = document.querySelectorAll(".game-option-btn");
    btns.forEach((b) => {
      if (b.innerText === currentCorrectAnswer) b.classList.add("correct");
    });
    if (gameMessage) {
      gameMessage.innerText = `❌ Incorrecto. Era "${currentCorrectAnswer}".`;
      gameMessage.classList.add("incorrect-msg");
    }
    playBeep("wrong");
    btn.style.transform = "translateX(4px)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  }
}

function enableOptions(enable) {
  const btns = document.querySelectorAll(".game-option-btn");
  btns.forEach((btn) => {
    if (enable) {
      btn.disabled = false;
      btn.classList.remove("correct", "incorrect");
    } else {
      btn.disabled = true;
    }
  });
}

function updateScore() {
  if (gameScore) gameScore.innerText = `Puntuación: ${score}`;
}

export function nextRound() {
  if (fragmentTimeout) clearTimeout(fragmentTimeout);
  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
  loadNewRound();
}
