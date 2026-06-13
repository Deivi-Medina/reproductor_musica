// js/audio.js
import DOM, { state, saveState, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";
import albums from "./canciones.js";

export let audio = new Audio();
audio.crossOrigin = "anonymous";

let audioCtx = null;
let audioSource = null;
let filterBass = null;
let filterVocals = null;
let filterTreble = null;

export let queue = [];
export let queueIndex = 0;
export let isPlaying = false;
export let isShuffleActive = false;
export let isRepeatActive = false;
let pistaContabilizada = false;

export function setQueue(newQueue, newIndex = 0) {
  queue = newQueue;
  queueIndex = newIndex;
}

export function playActiveSong() {
  if (queue.length === 0) return;
  const song = queue[queueIndex];
  prepareAudio();
  audio.src = song.file;
  pistaContabilizada = false;
  audio
    .play()
    .then(() => {
      isPlaying = true;
      updatePlayingUIs(true);
    })
    .catch(console.error);
}

export function togglePlayPause() {
  if (queue.length === 0) return;
  prepareAudio();
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayingUIs(false);
  } else {
    audio.play().catch(console.error);
    isPlaying = true;
    updatePlayingUIs(true);
  }
}

export function playNextTrack() {
  if (queue.length === 0) return;
  if (isShuffleActive && queue.length > 1) {
    let nIdx;
    do {
      nIdx = Math.floor(Math.random() * queue.length);
    } while (nIdx === queueIndex);
    queueIndex = nIdx;
  } else {
    queueIndex = (queueIndex + 1) % queue.length;
  }
  playActiveSong();
}

export function playPrevTrack() {
  if (queue.length === 0) return;
  queueIndex = (queueIndex - 1 + queue.length) % queue.length;
  playActiveSong();
}

export function toggleShuffle() {
  isShuffleActive = !isShuffleActive;
  if (DOM.audioControls.btnShuffle) DOM.audioControls.btnShuffle.classList.toggle("active-control", isShuffleActive);
}

export function toggleRepeat() {
  isRepeatActive = !isRepeatActive;
  if (DOM.audioControls.btnRepeat) DOM.audioControls.btnRepeat.classList.toggle("active-control", isRepeatActive);
}

export function toggleFavoriteStatus() {
  if (queue.length === 0) return;
  const currentSong = queue[queueIndex];
  const idx = state.favorites.findIndex((s) => s.file === currentSong.file);
  if (idx > -1) state.favorites.splice(idx, 1);
  else state.favorites.push(currentSong);
  saveState();
  updatePlayingUIs(isPlaying); // solo actualiza UI (corazón) sin cambiar reproducción
}

function registrarReproduccionArtista(track) {
  if (!track) return;
  let nombreArtista = track.artistName || "Artista Desconocido";
  if (track.originalAlbumIdx !== undefined && albums[track.originalAlbumIdx]) {
    nombreArtista = albums[track.originalAlbumIdx].artist;
  }
  const reproducciones = JSON.parse(localStorage.getItem("mg_artist_plays")) || {};
  reproducciones[nombreArtista] = (reproducciones[nombreArtista] || 0) + 1;
  localStorage.setItem("mg_artist_plays", JSON.stringify(reproducciones));
  console.log(`📈 UX Tracker: ${nombreArtista} sumó +1 reproducción. Total: ${reproducciones[nombreArtista]}`);
}

function onAudioTimeUpdate() {
  if (!audio.duration) return;
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
  if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
  if (DOM.audioControls.scrubber) DOM.audioControls.scrubber.value = progressPercent;
  if (DOM.audioControls.timeCurrent) DOM.audioControls.timeCurrent.innerText = formatTimerString(audio.currentTime);
  if (DOM.audioControls.timeTotal) DOM.audioControls.timeTotal.innerText = formatTimerString(audio.duration);

  if (progressPercent >= 70 && !pistaContabilizada && queue.length > 0) {
    registrarReproduccionArtista(queue[queueIndex]);
    pistaContabilizada = true;
  }
}

function onAudioEnded() {
  if (isRepeatActive) {
    audio.currentTime = 0;
    audio.play().catch(console.error);
  } else {
    playNextTrack();
  }
}

export function bindAudioEvents() {
  audio.addEventListener("timeupdate", onAudioTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
}

// Ecualizador
function initAudioContext() {
  if (audioCtx) return;
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return;
  try {
    audioCtx = new AudioCtxClass();
    audioSource = audioCtx.createMediaElementSource(audio);
    filterBass = audioCtx.createBiquadFilter();
    filterBass.type = "lowshelf";
    filterBass.frequency.value = 150;
    filterBass.gain.value = parseFloat(DOM.equalizer.bassSlider?.value || 0);
    filterVocals = audioCtx.createBiquadFilter();
    filterVocals.type = "peaking";
    filterVocals.frequency.value = 1500;
    filterVocals.Q.value = 1.0;
    filterVocals.gain.value = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
    filterTreble = audioCtx.createBiquadFilter();
    filterTreble.type = "highshelf";
    filterTreble.frequency.value = 6000;
    filterTreble.gain.value = parseFloat(DOM.equalizer.trebleSlider?.value || 0);
    audioSource.connect(filterBass);
    filterBass.connect(filterVocals);
    filterVocals.connect(filterTreble);
    filterTreble.connect(audioCtx.destination);
  } catch (e) {
    console.error(e);
  }
}

export function prepareAudio() {
  initAudioContext();
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

export function updateEqualizerNodeValues() {
  const bassVal = parseFloat(DOM.equalizer.bassSlider?.value || 0);
  const vocalsVal = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
  const trebleVal = parseFloat(DOM.equalizer.trebleSlider?.value || 0);
  if (DOM.equalizer.lblBass) DOM.equalizer.lblBass.innerText = `${bassVal > 0 ? "+" : ""}${bassVal} dB`;
  if (DOM.equalizer.lblVocals) DOM.equalizer.lblVocals.innerText = `${vocalsVal > 0 ? "+" : ""}${vocalsVal} dB`;
  if (DOM.equalizer.lblTreble) DOM.equalizer.lblTreble.innerText = `${trebleVal > 0 ? "+" : ""}${trebleVal} dB`;
  if (filterBass) filterBass.gain.value = bassVal;
  if (filterVocals) filterVocals.gain.value = vocalsVal;
  if (filterTreble) filterTreble.gain.value = trebleVal;
}
