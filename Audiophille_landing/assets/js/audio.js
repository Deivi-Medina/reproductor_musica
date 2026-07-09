// assets/js/audio.js
import DOM, { state, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";
import { toggleFavorite } from "./services/favoriteService.js";
import { registerPlay } from "./services/playStatsService.js";
import { notifyAchievementUnlock, loadAchievements } from "./achievements.js";
import { getAchievements } from "./services/achievementService.js";
import { getYouTubeId } from "./services/explorerService.js";
import { showAlert } from "./modals.js";

// ============================================================
// ELEMENTO DE AUDIO ÚNICO (MP3 nativo)
// ============================================================
export const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";
audio.volume = 1;

// ============================================================
// ESTADO GLOBAL DE LA COLA
// ============================================================
export let queue = [];
export let queueIndex = 0;
export let isPlaying = false;
export let isShuffleActive = false;
export let isRepeatActive = false;
let pistaContabilizada = false;
let currentPlayPromise = null;

// ============================================================
// NODOS DEL ECUALLIZADOR (AudioContext)
// ============================================================
let audioCtx = null;
let audioSource = null;
let filterBass = null;
let filterVocals = null;
let filterTreble = null;

// ============================================================
// REPRODUCTOR DE YOUTUBE
// ============================================================
let youtubePlayer = null;
let youtubeReady = false;
let youtubeCurrentVideoId = null;
let isYouTubePlaying = false;
let youtubeTimeUpdateInterval = null;
let youtubeErrorCount = 0;
let youtubeApiAvailable = true;
let youtubeApiKeyMissing = false;
let youtubePistaContabilizada = false;

// ============================================================
// CONTROLADOR UNIFICADO
// ============================================================
const player = {
  _currentType: null,
  _isLoading: false,

  getType() {
    if (queue.length === 0) return null;
    const song = queue[queueIndex];
    const url = song.file || song.archivo_url;
    if (!url || url === "null" || url === "") return null;
    if (url.startsWith("youtube:")) return "youtube";
    return "mp3";
  },

  // Carga y reproduce una canción desde cero
  async play() {
    if (queue.length === 0) return;
    const song = queue[queueIndex];
    const url = song.file || song.archivo_url;

    if (!url || url === "null" || url === "") {
      if (!youtubeApiAvailable || youtubeApiKeyMissing) {
        await showAlert("La reproducción desde YouTube no está disponible. Reproduciendo solo MP3 locales.", "Modo offline");
        this._setLoading(false);
        this.next();
        return;
      }
      await this._playYouTubeLazy(song);
      return;
    }

    if (url.startsWith("youtube:")) {
      if (!youtubeApiAvailable || youtubeApiKeyMissing) {
        await showAlert("La reproducción desde YouTube no está disponible. Pasando a la siguiente canción.", "Modo offline");
        this._setLoading(false);
        this.next();
        return;
      }
      await this._playYouTube(url.replace("youtube:", ""));
      return;
    }

    await this._playMP3(url);
  },

  async _playMP3(url) {
    this._setLoading(true);
    this._currentType = "mp3";
    prepareAudio();

    if (currentPlayPromise) {
      audio.pause();
      try {
        await currentPlayPromise;
      } catch (_) {}
      currentPlayPromise = null;
    }

    // Solo cambiamos el src si es una pista diferente para evitar perder la posición
    if (audio.src !== url) {
      audio.src = url;
      pistaContabilizada = false;
    }

    try {
      currentPlayPromise = audio.play();
      await currentPlayPromise;
      isPlaying = true;
      isYouTubePlaying = false;
      stopYouTubeTimeUpdate();
      updatePlayingUIs(true);
      this._setLoading(false);
    } catch (err) {
      console.warn("Error al reproducir MP3:", err);
      this._setLoading(false);
      if (youtubeApiAvailable && !youtubeApiKeyMissing) {
        await this._playYouTubeLazy(queue[queueIndex]);
      } else {
        await showAlert("No se pudo reproducir esta canción. Pasando a la siguiente.", "Error");
        this.next();
      }
    } finally {
      currentPlayPromise = null;
    }
  },

  async _playYouTube(videoId) {
    if (!videoId) {
      this._setLoading(false);
      this.next();
      return;
    }

    this._setLoading(true);
    this._currentType = "youtube";

    if (!youtubePlayer || !youtubeReady) {
      initYouTubePlayer();
      if (!youtubeReady) {
        await new Promise((resolve) => {
          const checkReady = setInterval(() => {
            if (youtubeReady && youtubePlayer) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);
          setTimeout(() => resolve(), 5000);
        });
      }
    }

    if (!youtubePlayer || !youtubeReady) {
      console.warn("YouTube Player no disponible");
      this._setLoading(false);
      if (!youtubeApiKeyMissing) {
        await showAlert("El reproductor de YouTube no está disponible.", "Error");
      }
      this.next();
      return;
    }

    youtubeCurrentVideoId = videoId;
    youtubePistaContabilizada = false;
    youtubePlayer.loadVideoById(videoId);
  },

  async _playYouTubeLazy(song) {
    if (!song.id_cancion) {
      this._setLoading(false);
      this.next();
      return;
    }

    try {
      const result = await getYouTubeId(song.id_cancion);
      if (!result || !result.success || !result.youtube_id) {
        this._setLoading(false);
        this.next();
        return;
      }

      const videoId = result.youtube_id;
      song.file = "youtube:" + videoId;
      song.archivo_url = "youtube:" + videoId;
      await this._playYouTube(videoId);
    } catch (error) {
      console.warn("Error en playYouTubeLazy:", error);
      this._setLoading(false);
      this.next();
    }
  },

  pause() {
    if (this._currentType === "youtube" && youtubePlayer && youtubeReady) {
      youtubePlayer.pauseVideo();
      isYouTubePlaying = false;
    } else if (this._currentType === "mp3") {
      audio.pause();
    }
    isPlaying = false;
    updatePlayingUIs(false);
    stopYouTubeTimeUpdate();
    this._setLoading(false);
  },

  // Alternancia limpia sin reiniciar el buffer
  async togglePlayPause() {
    if (queue.length === 0) return;

    if (isPlaying) {
      this.pause();
    } else {
      if (this._currentType === "mp3" && audio.src) {
        try {
          this._setLoading(true);
          await audio.play();
          isPlaying = true;
          updatePlayingUIs(true);
          this._setLoading(false);
        } catch (e) {
          this.play(); // Fallback si el buffer expiró
        }
      } else if (this._currentType === "youtube" && youtubePlayer && youtubeReady) {
        youtubePlayer.playVideo();
      } else {
        // Si no hay nada cargado previamente, inicia la cola con normalidad
        this.play();
      }
    }
  },

  // CORREGIDO: El bucle (repeat) ahora reinicia el track actual sin importar el largo de la cola
  next() {
    if (queue.length === 0 || this._isLoading) return;

    if (isRepeatActive) {
      this.seek(0);
      if (this._currentType === "mp3" && !isPlaying) {
        audio.play().catch(() => {});
        isPlaying = true;
        updatePlayingUIs(true);
      } else if (this._currentType === "youtube" && youtubePlayer && youtubeReady) {
        youtubePlayer.playVideo();
      }
      return;
    }

    if (isShuffleActive && queue.length > 1) {
      let nIdx;
      do {
        nIdx = Math.floor(Math.random() * queue.length);
      } while (nIdx === queueIndex);
      queueIndex = nIdx;
    } else {
      queueIndex = (queueIndex + 1) % queue.length;
    }

    this._stopCurrentOutputs();
    this.play();
  },

  prev() {
    if (queue.length === 0 || this._isLoading) return;

    queueIndex = (queueIndex - 1 + queue.length) % queue.length;
    this._stopCurrentOutputs();
    this.play();
  },

  _stopCurrentOutputs() {
    if (youtubePlayer && youtubeReady) {
      try {
        youtubePlayer.pauseVideo();
      } catch (_) {}
      isYouTubePlaying = false;
      stopYouTubeTimeUpdate();
    }
    audio.pause();
    audio.currentTime = 0;
  },

  seek(percent) {
    if (this._isLoading) return;
    const clampedPercent = Math.max(0, Math.min(1, percent));

    if (this._currentType === "youtube" && youtubePlayer && youtubeReady) {
      const duration = youtubePlayer.getDuration();
      if (duration > 0 && isFinite(duration)) {
        youtubePlayer.seekTo(clampedPercent * duration, true);
      }
    } else if (this._currentType === "mp3") {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        audio.currentTime = clampedPercent * audio.duration;
      }
    }
    this.updateVisualBars(clampedPercent * 100);
  },

  updateVisualBars(progressPercent) {
    if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
    if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
    if (DOM.audioControls.scrubber && !window.isScrubbing) {
      DOM.audioControls.scrubber.value = progressPercent;
    }
  },

  setVolume(volume) {
    const vol = Math.min(Math.max(volume, 0), 100);
    audio.volume = vol / 100;
    if (youtubePlayer && youtubeReady) {
      try {
        youtubePlayer.setVolume(vol);
      } catch (_) {}
    }
  },

  getCurrentTime() {
    return this._currentType === "youtube" && youtubePlayer && youtubeReady ? youtubePlayer.getCurrentTime() : audio.currentTime || 0;
  },

  getDuration() {
    return this._currentType === "youtube" && youtubePlayer && youtubeReady ? youtubePlayer.getDuration() : audio.duration || 0;
  },

  isLoading() {
    return this._isLoading;
  },

  _setLoading(loading) {
    this._isLoading = loading;
    document.dispatchEvent(new CustomEvent("playerLoading", { detail: { loading } }));
  },

  reset() {
    this._setLoading(false);
    this._currentType = null;
    this._stopCurrentOutputs();
    audio.src = "";
    audio.load();
    isPlaying = false;
    youtubeErrorCount = 0;
    updatePlayingUIs(false);
  },
};

export { player };
export const isLoading = () => player.isLoading();

// ============================================================
// FUNCIONES DE COLA Y REPRODUCCIÓN
// ============================================================
export function setQueue(newQueue, newIndex = 0) {
  queue = newQueue;
  queueIndex = newIndex;
  youtubePistaContabilizada = false;
  player.reset();
  if (queue.length > 0) player.play();
}

export async function playActiveSong() {
  await player.play();
}
export async function togglePlayPause() {
  player.togglePlayPause();
}
export function playNextTrack() {
  player.next();
  youtubePistaContabilizada = false;
}
export function playPrevTrack() {
  player.prev();
  youtubePistaContabilizada = false;
}

// ============================================================
// EVENTOS DEL AUDIO (MP3)
// ============================================================
async function onAudioTimeUpdate() {
  if (!audio.duration || window.isScrubbing) return;

  const progressPercent = (audio.currentTime / audio.duration) * 100;
  player.updateVisualBars(progressPercent);

  if (DOM.audioControls.timeCurrent) DOM.audioControls.timeCurrent.innerText = formatTimerString(audio.currentTime);
  if (DOM.audioControls.timeTotal) DOM.audioControls.timeTotal.innerText = formatTimerString(audio.duration);

  if (progressPercent >= 70 && !pistaContabilizada && queue.length > 0) {
    pistaContabilizada = true;
    const result = await registerPlay(queue[queueIndex]);
    if (result && result.unlocked && result.unlocked.length > 0) {
      await loadAchievements();
      const data = await getAchievements();
      if (data.success) {
        const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
        unlockedAchievements.forEach((ach) => notifyAchievementUnlock(ach));
      }
    }
  }
}

// CORREGIDO: El bucle ahora repite el MP3 sin importar el tamaño de la cola
function onAudioEnded() {
  if (isRepeatActive) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return;
  }
  player.next();
}

export function bindAudioEvents() {
  audio.removeEventListener("timeupdate", onAudioTimeUpdate);
  audio.removeEventListener("ended", onAudioEnded);
  audio.addEventListener("timeupdate", onAudioTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
}

// ============================================================
// REPRODUCTOR DE YOUTUBE
// ============================================================
function initYouTubePlayer() {
  if (youtubePlayer) return;
  const container = document.getElementById("youtubePlayerContainer");
  if (!container) {
    youtubeApiAvailable = false;
    return;
  }

  if (typeof YT === "undefined" || typeof YT.Player === "undefined") {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
    return;
  }

  try {
    youtubePlayer = new YT.Player("youtubePlayerContainer", {
      height: "0",
      width: "0",
      videoId: "",
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0, mute: 0 },
      events: { onReady: onYouTubeReady, onStateChange: onYouTubeStateChange, onError: onYouTubeError },
    });
    youtubeApiAvailable = true;
  } catch (e) {
    youtubeApiAvailable = false;
  }
}

function onYouTubeReady() {
  youtubeReady = true;
  youtubeApiAvailable = true;
}

function onYouTubeStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      isYouTubePlaying = true;
      isPlaying = true;
      player._setLoading(false);
      youtubeErrorCount = 0;
      updatePlayingUIs(true);
      startYouTubeTimeUpdate();
      break;
    case YT.PlayerState.PAUSED:
      isYouTubePlaying = false;
      isPlaying = false;
      updatePlayingUIs(false);
      stopYouTubeTimeUpdate();
      break;
    case YT.PlayerState.ENDED:
      isYouTubePlaying = false;
      isPlaying = false;
      updatePlayingUIs(false);
      stopYouTubeTimeUpdate();

      // CORREGIDO: El bucle ahora repite el video de YouTube sin importar el tamaño de la cola
      if (isRepeatActive) {
        youtubePlayer.loadVideoById(youtubeCurrentVideoId);
        return;
      }
      player.next();
      break;
    case YT.PlayerState.BUFFERING:
      player._setLoading(true);
      break;
    default:
      break;
  }
}

function onYouTubeError(error) {
  console.error("Falla detectada en Iframe de YouTube:", error.data);
  const errorCode = error.data;

  let romperBucle = false;

  if (errorCode === 100 || errorCode === 101 || errorCode === 150) {
    romperBucle = true;
  } else if (errorCode === 403 || errorCode === 2) {
    youtubeApiKeyMissing = true;
    youtubeApiAvailable = false;
    showAlert("La API de YouTube no se encuentra disponible (Sin cuota o bloqueo). Usando modo local.", "Modo offline");
    romperBucle = true;
  }

  isYouTubePlaying = false;
  isPlaying = false;
  player._setLoading(false);
  updatePlayingUIs(false);
  stopYouTubeTimeUpdate();

  if (romperBucle) {
    youtubeErrorCount = 0;
    player.next();
    return;
  }

  // Lógica del bucle de reintento corregida (Máximo 2 intentos antes de rendirse)
  youtubeErrorCount++;
  if (youtubeErrorCount <= 2 && youtubeCurrentVideoId && youtubePlayer && !youtubeApiKeyMissing) {
    console.warn(`Reintentando inicializar video roto... Intento ${youtubeErrorCount}/2`);
    setTimeout(() => {
      if (youtubeCurrentVideoId) youtubePlayer.loadVideoById(youtubeCurrentVideoId);
    }, 1200);
  } else {
    console.warn("Demasiados errores en este track de YouTube. Saltando.");
    youtubeErrorCount = 0;
    player.next();
  }
}

async function playYouTubeSong(videoId) {
  await player._playYouTube(videoId);
}

// ============================================================
// SINCRONIZACIÓN DE TIEMPO EN YOUTUBE
// ============================================================
function startYouTubeTimeUpdate() {
  stopYouTubeTimeUpdate();
  youtubeTimeUpdateInterval = setInterval(() => {
    if (isYouTubePlaying && youtubePlayer && youtubeReady) updateYouTubeProgress();
  }, 250);
}

// ... (Resto del código idéntico para controles de UI y volumen)
function stopYouTubeTimeUpdate() {
  if (youtubeTimeUpdateInterval) {
    clearInterval(youtubeTimeUpdateInterval);
    youtubeTimeUpdateInterval = null;
  }
}
async function updateYouTubeProgress() {
  try {
    if (window.isScrubbing) return;

    const current = youtubePlayer.getCurrentTime();
    const duration = youtubePlayer.getDuration();
    if (duration > 0 && isFinite(duration)) {
      const progressPercent = (current / duration) * 100;

      // Actualizar barras
      if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
      if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
      if (DOM.audioControls.scrubber) DOM.audioControls.scrubber.value = progressPercent;
      if (DOM.audioControls.timeCurrent) DOM.audioControls.timeCurrent.innerText = formatTimerString(current);
      if (DOM.audioControls.timeTotal) DOM.audioControls.timeTotal.innerText = formatTimerString(duration);

      // ✅ REGISTRAR REPRODUCCIÓN PARA YOUTUBE
      if (progressPercent >= 70 && !youtubePistaContabilizada && queue.length > 0) {
        youtubePistaContabilizada = true;
        const result = await registerPlay(queue[queueIndex]);
        if (result && result.unlocked && result.unlocked.length > 0) {
          await loadAchievements();
          const data = await getAchievements();
          if (data.success) {
            const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
            unlockedAchievements.forEach((ach) => notifyAchievementUnlock(ach));
          }
        }
      }
    }
  } catch (e) {
    /* Ignorar */
  }
}

export function toggleShuffle() {
  isShuffleActive = !isShuffleActive;
  const btn = document.getElementById("btnShuffle");
  if (btn) btn.classList.toggle("active-control", isShuffleActive);
}

export function toggleRepeat() {
  isRepeatActive = !isRepeatActive;
  const btn = document.getElementById("btnRepeat");
  if (btn) btn.classList.toggle("active-control", isRepeatActive);
}

export async function toggleFavoriteStatus() {
  if (queue.length === 0) return;
  const currentSong = queue[queueIndex];
  if (!currentSong.id_cancion) return;

  try {
    const result = await toggleFavorite(currentSong.id_cancion);
    if (result.success) {
      if (result.favorito) {
        if (!state.favorites.some((s) => s.id_cancion === currentSong.id_cancion)) state.favorites.push(currentSong);
      } else {
        state.favorites = state.favorites.filter((s) => s.id_cancion !== currentSong.id_cancion);
      }
      updatePlayingUIs(isPlaying);
    }
  } catch (error) {
    console.error(error);
  }
}

export function reorderQueue(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [removed] = queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, removed);

  if (queueIndex === fromIndex) queueIndex = toIndex;
  else if (fromIndex < queueIndex && toIndex >= queueIndex) queueIndex--;
  else if (fromIndex > queueIndex && toIndex <= queueIndex) queueIndex++;
}

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
    audioCtx = null;
  }
}

export function prepareAudio() {
  if (!audioCtx) initAudioContext();
  else if (audioCtx.state === "suspended") audioCtx.resume();
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

const volSlider = DOM.audioControls.volSlider;
const lblMasterVol = DOM.fullPlayer.lblMasterVol;

if (volSlider) {
  volSlider.addEventListener("input", function () {
    const val = parseFloat(this.value);
    player.setVolume(val);
    if (lblMasterVol) lblMasterVol.textContent = val + "%";
  });
  player.setVolume(parseFloat(volSlider.value));
}

if (DOM.audioControls.scrubber) {
  DOM.audioControls.scrubber.addEventListener("pointerdown", () => {
    window.isScrubbing = true;
  });

  DOM.audioControls.scrubber.addEventListener("input", function () {
    if (window.isScrubbing) {
      const currentPercent = parseFloat(this.value);
      if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${currentPercent}%`;
      if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${currentPercent}%`;
    }
  });

  DOM.audioControls.scrubber.addEventListener("pointerup", function () {
    window.isScrubbing = false;
    const percent = parseFloat(this.value) / 100;
    if (percent >= 0 && percent <= 1) player.seek(percent);
  });
}

window.onYouTubeIframeAPIReady = function () {
  initYouTubePlayer();
};
if (typeof YT !== "undefined" && YT.loaded) initYouTubePlayer();

export { playYouTubeSong, youtubePlayer, youtubeReady, isYouTubePlaying };
