// js/audio.js
import DOM, { state, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";

export let audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";

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

let currentPlayPromise = null;

export function setQueue(newQueue, newIndex = 0) {
  queue = newQueue;
  queueIndex = newIndex;
}

export async function playActiveSong() {
  if (queue.length === 0) return;
  const song = queue[queueIndex];
  prepareAudio();

  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (e) {}
    currentPlayPromise = null;
  }

  audio.src = song.file;
  pistaContabilizada = false;
  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
    isPlaying = true;
    updatePlayingUIs(true);
  } catch (err) {
    console.warn("Error al reproducir:", err);
  } finally {
    currentPlayPromise = null;
  }
}

export async function togglePlayPause() {
  if (queue.length === 0) return;
  prepareAudio();

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayingUIs(false);
  } else {
    try {
      if (currentPlayPromise) {
        try {
          await currentPlayPromise;
        } catch (e) {}
        currentPlayPromise = null;
      }
      currentPlayPromise = audio.play();
      await currentPlayPromise;
      isPlaying = true;
      updatePlayingUIs(true);
    } catch (err) {
      console.warn("Error al reanudar:", err);
    } finally {
      currentPlayPromise = null;
    }
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

// Función para alternar favorito usando la API
export async function toggleFavoriteStatus() {
  if (queue.length === 0) return;
  const currentSong = queue[queueIndex];
  if (!currentSong.id_cancion) {
    console.warn("La canción no tiene id_cancion, no se puede marcar como favorita");
    return;
  }

  const formData = new FormData();
  formData.append("action", "toggle_favorite");
  formData.append("id_cancion", currentSong.id_cancion);

  try {
    const response = await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
    const data = await response.json();
    if (data.success) {
      // Actualizar estado local
      if (data.favorito) {
        // Agregar a favoritos si no está
        if (!state.favorites.some((s) => s.id_cancion === currentSong.id_cancion)) {
          state.favorites.push(currentSong);
        }
      } else {
        // Eliminar de favoritos
        state.favorites = state.favorites.filter((s) => s.id_cancion !== currentSong.id_cancion);
      }
      // Actualizar UI del botón de favorito
      updatePlayingUIs(isPlaying);
    } else {
      console.error("Error al cambiar favorito:", data.message);
    }
  } catch (error) {
    console.error("Error de red:", error);
  }
}

// Registrar reproducción de artista mediante API
async function registrarReproduccionArtista(track) {
  if (!track) return;
  let nombreArtista = track.artistName || "Artista Desconocido";
  // Si la canción tiene id_artista, lo usamos; si no, enviamos el nombre
  const formData = new FormData();
  formData.append("action", "register_play");
  if (track.id_artista) {
    formData.append("id_artista", track.id_artista);
  } else {
    formData.append("nombre_artista", nombreArtista);
  }
  try {
    await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
  } catch (e) {
    console.error("Error al registrar reproducción:", e);
  }
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
