// js/var.js
import albums from "./canciones.js";

// --- CENTRALIZACIÓN DE TODOS LOS ELEMENTOS DEL DOM ---
const DOM = {
  sidebar: {
    navHome: document.getElementById("navHome"),
    navFavorites: document.getElementById("navFavorites"),
    navDiary: document.getElementById("navDiary"),
    navGame: document.getElementById("navGame"),
    btnCreatePlaylist: document.getElementById("btnCreatePlaylist"),
    playlistsContainer: document.getElementById("playlistsDynamicContainer"),
  },

  views: {
    library: document.getElementById("mainLibrary"),
    albumDetail: document.getElementById("albumDetailView"),
    diary: document.getElementById("diaryView"),
    game: document.getElementById("gameView"), // ✅ NUEVO
    tracksList: document.getElementById("tracksDynamicList"),
    albumGrid: document.getElementById("albumGrid"),
    header: document.getElementById("globalHeader"),
    searchBar: document.getElementById("globalSearch"),
  },

  currentAlbumDetail: {
    cover: document.getElementById("detailAlbumCover"),
    title: document.getElementById("detailAlbumTitle"),
    artist: document.getElementById("detailAlbumArtist"),
  },

  contextMenu: {
    container: document.getElementById("contextMenuContainer"),
    btnAddToQueue: document.getElementById("ctxAddToQueue"),
    playlistsList: document.getElementById("ctxPlaylistsList"),
  },

  miniPlayer: {
    container: document.getElementById("miniPlayer"),
    cover: document.getElementById("miniCover"),
    title: document.getElementById("miniTitle"),
    artist: document.getElementById("miniArtist"),
    btnPlay: document.getElementById("btnMiniPlay"),
    progressFill: document.getElementById("miniProgressFill"),
  },

  fullPlayer: {
    container: document.getElementById("playerOverlay"),
    title: document.getElementById("currentTitle"),
    artist: document.getElementById("currentArtist"),
    cover: document.getElementById("currentCover"),
    btnFavorite: document.getElementById("btnMainFavorite"),
  },

  audioControls: {
    scrubber: document.getElementById("timelineScrubber"),
    progressFill: document.getElementById("premiumProgressFill"),
    timeCurrent: document.getElementById("timeCurrent"),
    timeTotal: document.getElementById("timeTotal"),
    btnPlay: document.getElementById("btnMainPlay"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    btnShuffle: document.getElementById("btnShuffle"),
    btnRepeat: document.getElementById("btnRepeat"),
    volSlider: document.getElementById("volSlider"),
  },

  queue: {
    sidebar: document.getElementById("queueSidebar"),
    btnToggle: document.getElementById("btnToggleQueueSidebar"),
    dynamicList: document.getElementById("queueDynamicList"),
  },

  modal: {
    overlay: document.getElementById("playlistModal"),
    input: document.getElementById("modalPlaylistName"),
    imgInput: document.getElementById("imagenPlaylistInput"),
    btnConfirm: document.getElementById("btnModalConfirm"),
    btnCancel: document.getElementById("btnModalCancel"),
    btnClose: document.getElementById("btnModalClose"),
  },

  musikChat: {
    input: document.getElementById("musikInput"),
    btnSend: document.getElementById("btnMusikSend"),
    contenedorMensajes: document.querySelector(".musik-chat-messages"),
    fileInput: document.getElementById("musikFileInput"),
    btnImport: document.getElementById("btnMusikImport"),
  },

  albumActions: {
    row: document.getElementById("albumActionsDetailRow"),
    btnEdit: document.getElementById("btnEditAlbum"),
    btnDelete: document.getElementById("btnDeleteAlbum"),
  },

  editAlbumModal: {
    modal: document.getElementById("editAlbumModal"),
    headerTitle: document.getElementById("editModalHeaderTitle"),
    lblTitle: document.getElementById("lblEditAlbumTitle"),
    artistGroup: document.getElementById("editAlbumArtistGroup"),
    inputTitle: document.getElementById("editAlbumTitleInput"),
    inputArtist: document.getElementById("editAlbumArtistInput"),
    inputCover: document.getElementById("editAlbumCoverInput"),
    coverFileInput: document.getElementById("editAlbumCoverFileInput"),
    btnUploadCover: document.getElementById("btnEditUploadCover"),
    songsContainer: document.getElementById("editAlbumSongsContainer"),
    btnAddSong: document.getElementById("btnEditAlbumAddSong"),
    addSongFileInput: document.getElementById("editAlbumAddSongFileInput"),
    btnClose: document.getElementById("btnEditAlbumClose"),
    btnCancel: document.getElementById("btnEditAlbumCancel"),
    btnConfirm: document.getElementById("btnEditAlbumConfirm"),
  },

  equalizer: {
    sidebar: document.getElementById("equalizerSidebar"),
    btnToggle: document.getElementById("btnToggleEqualizer"),
    bassSlider: document.getElementById("eqBass"),
    vocalsSlider: document.getElementById("eqVocals"),
    trebleSlider: document.getElementById("eqTreble"),
    btnReset: document.getElementById("btnResetEqualizer"),
    lblBass: document.getElementById("lblEqBass"),
    lblVocals: document.getElementById("lblEqVocals"),
    lblTreble: document.getElementById("lblEqTreble"),
  },

  extra: {
    reviewsSidebar: document.getElementById("reviewsSidebar"),
    playlistInlineContainer: document.getElementById("playlistAddSongInlineContainer"),
  },

  musikWidget: {
    btnTrigger: document.getElementById("btnMusikTrigger"),
    chatWindow: document.getElementById("musikChatWindow"),
    btnMinimize: document.getElementById("btnMinimizeMusik"),
    btnExpand: document.getElementById("btnExpandMusik"),
  },

  // Referencias para el juego (elementos individuales)
  game: {
    container: document.getElementById("gameView"),
    cover: document.getElementById("gameCover"),
    score: document.getElementById("gameScore"),
    optionsContainer: document.getElementById("gameOptions"),
    nextBtn: document.getElementById("gameNextBtn"),
    message: document.getElementById("gameMessage"),
    playingIndicator: document.getElementById("gamePlayingIndicator"),
  },
};

// ... el resto del archivo (state, saveState, formatTimerString, saveAllAlbums, preloadDurations) se mantiene igual
// --- ESTADO GLOBAL ---
export const state = {
  favorites: JSON.parse(localStorage.getItem("mg_favorites_vanilla")) || [],
  playlists: JSON.parse(localStorage.getItem("mg_playlists_vanilla")) || {},
  importedSongs: JSON.parse(localStorage.getItem("mg_imported_songs_vanilla")) || [],
  currentSection: "home",
  activeAlbumIndex: null,
  activePlaylistName: null,
};

// --- FUNCIONES AUXILIARES ---
export function saveState() {
  localStorage.setItem("mg_favorites_vanilla", JSON.stringify(state.favorites));
  localStorage.setItem("mg_playlists_vanilla", JSON.stringify(state.playlists));
  localStorage.setItem("mg_imported_songs_vanilla", JSON.stringify(state.importedSongs));
}

export function formatTimerString(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function saveAllAlbums(list = albums) {
  const toSave = list.filter((a) => a.title !== "Mis Archivos Importados");
  localStorage.setItem("mg_all_albums_crud", JSON.stringify(toSave));
}

export function preloadDurations(songsArray, containerElement) {
  songsArray.forEach((song, idx) => {
    const tempAudio = new Audio(song.file);
    tempAudio.addEventListener("loadedmetadata", () => {
      const timeStr = formatTimerString(tempAudio.duration);
      const targetRow = containerElement.children[idx];
      if (targetRow) {
        const durSpan = targetRow.querySelector(".track-duration");
        if (durSpan) durSpan.innerText = timeStr;
      }
    });
  });
}

// Congelamos el objeto para evitar mutaciones accidentales
export default Object.freeze(DOM);
