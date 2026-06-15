// js/var.js
import albums from "./canciones.js"; // Solo para compatibilidad, ya no se usa directamente

// ================== REFERENCIAS AL DOM ==================
const DOM = {
  sidebar: {
    navHome: document.getElementById("navHome"),
    navFavorites: document.getElementById("navFavorites"),
    navDiary: document.getElementById("navDiary"),
    navGame: document.getElementById("navGame"),
    navProfile: document.getElementById("navProfile"),
    btnCreatePlaylist: document.getElementById("btnCreatePlaylist"),
    playlistsContainer: document.getElementById("playlistsDynamicContainer"),
  },
  views: {
    library: document.getElementById("mainLibrary"),
    albumDetail: document.getElementById("albumDetailView"),
    diary: document.getElementById("diaryView"),
    game: document.getElementById("gameView"),
    profile: document.getElementById("profileView"),
    tracksList: document.getElementById("tracksDynamicList"),
    albumGrid: document.getElementById("albumGrid"),
    header: document.getElementById("globalHeader"),
    searchBar: document.getElementById("globalSearch"),
    artistProfile: document.getElementById("artistProfileView"),
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

// ================== ESTADO GLOBAL ==================
export const state = {
  favorites: [],
  playlists: {},
  importedSongs: [],
  currentSection: "home",
  activeAlbumIndex: null,
  activePlaylistName: null,
  followedArtists: [],
  user_id: window.userId || null,
  loaded: false,
};

// ================== FUNCIONES AUXILIARES ==================
export function formatTimerString(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export function preloadDurations(songsArray, containerElement) {
  if (!songsArray || !containerElement) return;
  songsArray.forEach((song, idx) => {
    const audioUrl = song.file || song.archivo_url;
    if (!audioUrl) return;
    const tempAudio = new Audio(audioUrl);
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

// ================== CARGA DE DATOS DESDE LA API ==================
export async function loadInitialData() {
  if (!state.user_id) {
    console.warn("No hay user_id, no se pueden cargar datos.");
    return false;
  }
  try {
    const res = await fetch(`${window.baseUrl}api.php?action=get_initial_data`);
    const data = await res.json();
    if (!data.success) {
      console.error("Error al cargar datos iniciales:", data.message);
      return false;
    }

    window.albumsFromDB = data.albumes.map((album) => ({
      id_album: album.id_album,
      title: album.titulo,
      artist: album.artista,
      cover: album.caratula_url,
      genre: album.genero,
      songs: album.songs.map((s) => ({
        id_cancion: s.id_cancion,
        trackTitle: s.titulo,
        file: s.archivo_url,
        duracion: s.duracion_segundos,
        numero: s.numero_pista,
        genre: s.genero,
        artistName: album.artista,
        albumCover: album.caratula_url,
      })),
    }));

    // ========== CORRECCIÓN: Playlists con portada real ==========
    state.playlists = {};
    data.playlists.forEach((pl) => {
      state.playlists[pl.nombre] = {
        id_playlist: pl.id_playlist,
        portada: pl.portada_url,
        canciones: (pl.canciones || []).map((c) => ({
          id_cancion: c.id_cancion,
          trackTitle: c.titulo,
          file: c.archivo_url,
          artistName: c.artista_nombre || "Artista",
          // USAR EL CAMPO CORRECTO 'album_cover' (con guion bajo) y URL por defecto real
          albumCover: c.album_cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400",
          originalAlbumIdx: null,
        })),
      };
    });

    state.favorites = [];
    const allSongsMap = new Map();
    window.albumsFromDB.forEach((album) => {
      album.songs.forEach((song) => {
        allSongsMap.set(song.id_cancion, song);
      });
    });
    data.favoritos.forEach((id) => {
      const song = allSongsMap.get(id);
      if (song) state.favorites.push(song);
    });

    state.importedSongs = data.importadas.map((s) => ({
      id_cancion: s.id_cancion,
      trackTitle: s.titulo,
      file: s.archivo_url,
      artistName: s.artistName || "Importado",
      albumCover: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
    }));

    if (data.followed_artists) state.followedArtists = data.followed_artists;

    if (data.eq) {
      if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.value = data.eq.bass;
      if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.value = data.eq.vocals;
      if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.value = data.eq.treble;
    }

    if (data.reviews) window.reviewsData = data.reviews;

    state.loaded = true;
    return true;
  } catch (err) {
    console.error("Error en loadInitialData:", err);
    return false;
  }
}

// ================== FUNCIONES PARA GUARDAR EN LA API ==================
export async function saveEqToAPI(bass, vocals, treble) {
  if (!state.user_id) return;
  const formData = new FormData();
  formData.append("action", "update_eq");
  formData.append("bass", bass);
  formData.append("vocals", vocals);
  formData.append("treble", treble);
  try {
    await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
  } catch (e) {
    console.error("Error guardando EQ:", e);
  }
}

export async function saveFollowedArtistsToAPI(artistName, follow) {
  if (!state.user_id) return;
  const formData = new FormData();
  formData.append("action", "toggle_follow_artist");
  formData.append("artist_name", artistName);
  formData.append("follow", follow ? "1" : "0");
  try {
    await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
  } catch (e) {
    console.error("Error guardando artista seguido:", e);
  }
}

// ================== FUNCIONES OBSOLETAS ==================
export function saveState() {
  console.warn("saveState() ya no es necesario. Usar API.");
}

export function saveAllAlbums() {
  console.warn("saveAllAlbums() ya no es necesario. Usar API.");
}

// ================== EXPOSICIÓN GLOBAL ==================
window.state = state;

// ================== EXPORTACIÓN POR DEFECTO ==================
export default Object.freeze(DOM);
