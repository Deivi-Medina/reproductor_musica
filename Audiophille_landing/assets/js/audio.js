// js/audio.js
import DOM, { state, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";
import { toggleFavorite } from "./services/favoriteService.js";
import { registerPlay } from "./services/playStatsService.js";

// ============================================================
// AUDIO ELEMENT
// ============================================================
export const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";

// ============================================================
// ESTADO DEL REPRODUCTOR
// ============================================================
export let queue = [];
export let queueIndex = 0;
export let isPlaying = false;
export let isShuffleActive = false;
export let isRepeatActive = false;
let pistaContabilizada = false;
let currentPlayPromise = null;

// ============================================================
// ESTADO DEL ECUALIZADOR (AudioContext)
// ============================================================
let audioCtx = null;
let audioSource = null;
let filterBass = null;
let filterVocals = null;
let filterTreble = null;

// ============================================================
// FUNCIONES DE COLA
// ============================================================
export function setQueue(newQueue, newIndex = 0) {
  queue = newQueue;
  queueIndex = newIndex;
}

// ============================================================
// REPRODUCCIÓN
// ============================================================
export async function playActiveSong() {
  if (queue.length === 0) return;
  const song = queue[queueIndex];
  prepareAudio();

  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (_) {}
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
        } catch (_) {}
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

// ============================================================
// SHUFFLE / REPEAT
// ============================================================
export function toggleShuffle() {
  isShuffleActive = !isShuffleActive;
  if (DOM.audioControls.btnShuffle) {
    DOM.audioControls.btnShuffle.classList.toggle("active-control", isShuffleActive);
  }
}

export function toggleRepeat() {
  isRepeatActive = !isRepeatActive;
  if (DOM.audioControls.btnRepeat) {
    DOM.audioControls.btnRepeat.classList.toggle("active-control", isRepeatActive);
  }
}

// ============================================================
// FAVORITOS (USANDO SERVICIO)
// ============================================================
export async function toggleFavoriteStatus() {
  if (queue.length === 0) return;
  const currentSong = queue[queueIndex];
  if (!currentSong.id_cancion) {
    console.warn("La canción no tiene id_cancion, no se puede marcar como favorita");
    return;
  }

  try {
    const result = await toggleFavorite(currentSong.id_cancion);
    if (result.success) {
      // Actualizar estado local
      if (result.favorito) {
        if (!state.favorites.some((s) => s.id_cancion === currentSong.id_cancion)) {
          state.favorites.push(currentSong);
        }
      } else {
        state.favorites = state.favorites.filter((s) => s.id_cancion !== currentSong.id_cancion);
      }
      // Actualizar UI
      updatePlayingUIs(isPlaying);
    } else {
      console.error("Error al cambiar favorito:", result.message);
    }
  } catch (error) {
    console.error("Error de red al cambiar favorito:", error);
  }
}

// ============================================================
// REGISTRO DE REPRODUCCIÓN (USANDO SERVICIO)
// ============================================================
function onAudioTimeUpdate() {
  if (!audio.duration) return;
  const progressPercent = (audio.currentTime / audio.duration) * 100;

  // Actualizar UI de progreso
  if (DOM.miniPlayer.progressFill) {
    DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
  }
  if (DOM.audioControls.progressFill) {
    DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
  }
  if (DOM.audioControls.scrubber) {
    DOM.audioControls.scrubber.value = progressPercent;
  }
  if (DOM.audioControls.timeCurrent) {
    DOM.audioControls.timeCurrent.innerText = formatTimerString(audio.currentTime);
  }
  if (DOM.audioControls.timeTotal) {
    DOM.audioControls.timeTotal.innerText = formatTimerString(audio.duration);
  }

  // Registrar reproducción al 70% (solo una vez por canción)
  if (progressPercent >= 70 && !pistaContabilizada && queue.length > 0) {
    const track = queue[queueIndex];
    registerPlay(track); // Servicio centralizado
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

// ============================================================
// EVENTOS DEL AUDIO
// ============================================================
export function bindAudioEvents() {
  audio.addEventListener("timeupdate", onAudioTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
}

// ============================================================
// ECUALIZADOR (AudioContext)
// ============================================================
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
    console.error("Error al inicializar AudioContext:", e);
  }
}

export function prepareAudio() {
  initAudioContext();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function updateEqualizerNodeValues() {
  const bassVal = parseFloat(DOM.equalizer.bassSlider?.value || 0);
  const vocalsVal = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
  const trebleVal = parseFloat(DOM.equalizer.trebleSlider?.value || 0);

  if (DOM.equalizer.lblBass) {
    DOM.equalizer.lblBass.innerText = `${bassVal > 0 ? "+" : ""}${bassVal} dB`;
  }
  if (DOM.equalizer.lblVocals) {
    DOM.equalizer.lblVocals.innerText = `${vocalsVal > 0 ? "+" : ""}${vocalsVal} dB`;
  }
  if (DOM.equalizer.lblTreble) {
    DOM.equalizer.lblTreble.innerText = `${trebleVal > 0 ? "+" : ""}${trebleVal} dB`;
  }

  if (filterBass) filterBass.gain.value = bassVal;
  if (filterVocals) filterVocals.gain.value = vocalsVal;
  if (filterTreble) filterTreble.gain.value = trebleVal;
}
