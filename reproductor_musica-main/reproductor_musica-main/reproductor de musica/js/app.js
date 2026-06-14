// js/app.js
import albums from "./canciones.js";
import DOM, { state, saveAllAlbums } from "./var.js";
import {
  bindAudioEvents,
  updateEqualizerNodeValues,
  togglePlayPause,
  playNextTrack,
  playPrevTrack,
  toggleShuffle,
  toggleRepeat,
  toggleFavoriteStatus,
  audio,
  queue,
  queueIndex,
} from "./audio.js";
import {
  renderAlbumCards,
  openAlbumView,
  closeAlbumView,
  renderFavoritesDetailView,
  renderPlaylistDetailView,
  addContextSongToQueue,
  addContextSongToSpecificPlaylist,
} from "./ui.js";
import { renderPlaylistsSidebarLinks, openPlaylistModal, closePlaylistModal, createPlaylistAction } from "./playlist.js";
import {
  openEditAlbumModal,
  closeEditAlbumModal,
  confirmEditAlbumChanges,
  handleEditAlbumAddLocalSong,
  deleteActiveAlbum,
} from "./album-crud.js";
import { triggerChatAction, handleLocalFileImport } from "./chat.js";
import { initKeyboardControls } from "./keyboard.js";
import { initReviewsSystem, updateDiarySongsSelector, renderIntegratedDiaryFeed } from "./reviews.js";
import { showSection } from "./navigation.js";
import { initGameDOM, startGame, stopGame, nextRound } from "./game.js";

// Funciones de carga inicial
function loadCustomAlbums() {
  const stored = localStorage.getItem("mg_all_albums_crud");
  if (stored) {
    const loaded = JSON.parse(stored);
    albums.length = 0;
    albums.push(...loaded);
  } else {
    const customAlbums = JSON.parse(localStorage.getItem("mg_custom_albums_vanilla")) || [];
    customAlbums.forEach((customAlbum) => {
      if (!albums.find((a) => a.title === customAlbum.title && a.artist === customAlbum.artist)) albums.push(customAlbum);
    });
    saveAllAlbums();
  }
}

function rebuildImportedSongsAlbum() {
  if (state.importedSongs.length > 0) {
    let idx = albums.findIndex((a) => a.title === "Mis Archivos Importados");
    if (idx > -1) albums[idx].songs = state.importedSongs;
    else
      albums.push({
        title: "Mis Archivos Importados",
        artist: "Usuario Local",
        cover: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
        songs: state.importedSongs,
      });
  }
}

// Inicialización
function initApp() {
  loadCustomAlbums();
  rebuildImportedSongsAlbum();
  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  bindAudioEvents();
  initKeyboardControls();
  initGameDOM();

  // Listeners de navegación
  if (DOM.sidebar.navHome) DOM.sidebar.navHome.addEventListener("click", () => showSection("home"));
  if (DOM.sidebar.navFavorites) DOM.sidebar.navFavorites.addEventListener("click", () => showSection("favorites"));
  if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.addEventListener("click", () => showSection("diary"));
  if (DOM.sidebar.navGame) DOM.sidebar.navGame.addEventListener("click", () => showSection("game"));
  if (DOM.sidebar.btnCreatePlaylist) DOM.sidebar.btnCreatePlaylist.addEventListener("click", openPlaylistModal);
  if (DOM.modal.btnClose) DOM.modal.btnClose.addEventListener("click", closePlaylistModal);
  if (DOM.modal.btnCancel) DOM.modal.btnCancel.addEventListener("click", closePlaylistModal);
  if (DOM.modal.btnConfirm) DOM.modal.btnConfirm.addEventListener("click", createPlaylistAction);

  // Context menu con delegación de eventos
  document.addEventListener("click", () => DOM.contextMenu.container?.classList.add("hidden"));
  if (DOM.contextMenu.container) {
    DOM.contextMenu.container.addEventListener("click", (e) => {
      const target = e.target.closest(".context-option");
      if (!target) return;
      if (target.id === "ctxAddToQueue") {
        addContextSongToQueue();
      } else if (target.dataset.playlistName) {
        addContextSongToSpecificPlaylist(target.dataset.playlistName);
      }
      DOM.contextMenu.container.classList.add("hidden");
    });
  }

  // Controles de audio
  if (DOM.audioControls.volSlider)
    DOM.audioControls.volSlider.addEventListener("input", (e) => {
      audio.volume = e.target.value / 100;
    });
  if (DOM.audioControls.btnPlay) DOM.audioControls.btnPlay.addEventListener("click", togglePlayPause);
  if (DOM.miniPlayer.btnPlay) DOM.miniPlayer.btnPlay.addEventListener("click", togglePlayPause);
  if (DOM.audioControls.btnNext) DOM.audioControls.btnNext.addEventListener("click", playNextTrack);
  if (DOM.audioControls.btnPrev) DOM.audioControls.btnPrev.addEventListener("click", playPrevTrack);
  if (DOM.audioControls.btnShuffle) DOM.audioControls.btnShuffle.addEventListener("click", toggleShuffle);
  if (DOM.audioControls.btnRepeat) DOM.audioControls.btnRepeat.addEventListener("click", toggleRepeat);
  if (DOM.fullPlayer.btnFavorite) DOM.fullPlayer.btnFavorite.addEventListener("click", toggleFavoriteStatus);

  // Scrubber
  if (DOM.audioControls.scrubber)
    DOM.audioControls.scrubber.addEventListener("input", (e) => {
      if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });

  // Búsqueda
  if (DOM.views.searchBar) DOM.views.searchBar.addEventListener("input", (e) => renderAlbumCards(e.target.value));

  // Expandir/minimizar reproductor
  window.expandFullPlayer = () => {
    if (DOM.fullPlayer.container) DOM.fullPlayer.container.classList.remove("hidden");
    if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.add("hidden");
  };
  window.minimizeFullPlayer = () => {
    if (DOM.fullPlayer.container) DOM.fullPlayer.container.classList.add("hidden");
    if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.remove("hidden");
  };

  // Ecualizador
  if (DOM.equalizer.btnToggle && DOM.equalizer.sidebar) {
    DOM.equalizer.btnToggle.addEventListener("click", () => {
      DOM.equalizer.sidebar.classList.toggle("collapsed");
      if (!DOM.equalizer.sidebar.classList.contains("collapsed")) {
        if (DOM.queue.sidebar) DOM.queue.sidebar.classList.add("collapsed");
        if (DOM.extra.reviewsSidebar) DOM.extra.reviewsSidebar?.classList.add("collapsed");
      }
    });
  }
  if (DOM.queue.btnToggle && DOM.queue.sidebar) {
    DOM.queue.btnToggle.addEventListener("click", () => {
      DOM.queue.sidebar.classList.toggle("collapsed");
      if (!DOM.queue.sidebar.classList.contains("collapsed") && DOM.equalizer.sidebar) {
        DOM.equalizer.sidebar.classList.add("collapsed");
        if (DOM.extra.reviewsSidebar) DOM.extra.reviewsSidebar?.classList.add("collapsed");
      }
    });
  }
  if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.btnReset)
    DOM.equalizer.btnReset.addEventListener("click", () => {
      if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.value = 0;
      if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.value = 0;
      if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.value = 0;
      updateEqualizerNodeValues();
    });

  // Asistente musik
  if (DOM.musikWidget.btnTrigger && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnTrigger.addEventListener("click", () => DOM.musikWidget.chatWindow.classList.toggle("musik-hidden"));
  }
  if (DOM.musikWidget.btnMinimize && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnMinimize.addEventListener("click", () => DOM.musikWidget.chatWindow.classList.add("musik-hidden"));
  }
  if (DOM.musikWidget.btnExpand && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnExpand.addEventListener("click", () => {
      DOM.musikWidget.chatWindow.classList.toggle("expanded");
      const expanded = DOM.musikWidget.chatWindow.classList.contains("expanded");
      DOM.musikWidget.btnExpand.innerHTML = expanded ? `<i data-lucide="minimize-2"></i>` : `<i data-lucide="maximize-2"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }
  if (DOM.musikChat.btnSend) DOM.musikChat.btnSend.addEventListener("click", triggerChatAction);
  if (DOM.musikChat.input)
    DOM.musikChat.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") triggerChatAction();
    });
  if (DOM.musikChat.btnImport) DOM.musikChat.btnImport.addEventListener("click", () => DOM.musikChat.fileInput?.click());
  if (DOM.musikChat.fileInput) DOM.musikChat.fileInput.addEventListener("change", handleLocalFileImport);

  // Edición de álbumes
  if (DOM.albumActions.btnEdit) DOM.albumActions.btnEdit.addEventListener("click", openEditAlbumModal);
  if (DOM.albumActions.btnDelete) DOM.albumActions.btnDelete.addEventListener("click", deleteActiveAlbum);
  if (DOM.editAlbumModal.btnClose) DOM.editAlbumModal.btnClose.addEventListener("click", closeEditAlbumModal);
  if (DOM.editAlbumModal.btnCancel) DOM.editAlbumModal.btnCancel.addEventListener("click", closeEditAlbumModal);
  if (DOM.editAlbumModal.btnConfirm) DOM.editAlbumModal.btnConfirm.addEventListener("click", confirmEditAlbumChanges);
  if (DOM.editAlbumModal.btnUploadCover && DOM.editAlbumModal.coverFileInput) {
    DOM.editAlbumModal.btnUploadCover.addEventListener("click", () => DOM.editAlbumModal.coverFileInput.click());
    DOM.editAlbumModal.coverFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          DOM.editAlbumModal.inputCover.value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  if (DOM.editAlbumModal.btnAddSong && DOM.editAlbumModal.addSongFileInput) {
    DOM.editAlbumModal.btnAddSong.addEventListener("click", () => DOM.editAlbumModal.addSongFileInput.click());
    DOM.editAlbumModal.addSongFileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) handleEditAlbumAddLocalSong(e.target.files[0]);
    });
  }

  // Exponer funciones globales para compatibilidad con HTML (onclick, etc.)
  window.openAlbumView = openAlbumView;
  window.closeAlbumView = closeAlbumView;
  window.renderPlaylistsSidebarLinks = renderPlaylistsSidebarLinks;
  window.renderAlbumCards = renderAlbumCards;
  window.nextRound = nextRound; // Para el botón "Siguiente canción"

  // Inicializar sistema de reseñas
  initReviewsSystem(
    () => (queue.length ? queue[queueIndex] : null),
    () => {
      const all = [];
      albums.forEach((album) =>
        album.songs.forEach((song) =>
          all.push({
            trackTitle: song.trackTitle,
            artistName: song.artistName || album.artist,
            albumCover: song.albumCover || album.cover,
          }),
        ),
      );
      return all;
    },
  );

  if (window.lucide) window.lucide.createIcons();
}

// Arrancar la app
document.addEventListener("DOMContentLoaded", initApp);
