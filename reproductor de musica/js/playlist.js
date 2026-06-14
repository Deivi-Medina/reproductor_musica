// js/playlist.js
import DOM, { state, saveState } from "./var.js";
import { showSection } from "./navigation.js";
import { renderAlbumCards } from "./ui.js";
import { setQueue, playActiveSong } from "./audio.js";
import { showAlert, showConfirm } from "./modals.js";

export function renderPlaylistsSidebarLinks() {
  if (!DOM.sidebar.playlistsContainer) return;
  DOM.sidebar.playlistsContainer.innerHTML = "";
  Object.keys(state.playlists).forEach((pName) => {
    const playlist = state.playlists[pName];
    const link = document.createElement("button");
    link.className = "playlist-link";
    link.dataset.name = pName;
    link.innerHTML = `<i data-lucide="music"></i> <span>${pName}</span>`;
    link.addEventListener("click", () => showSection(`playlist:${pName}`));
    link.addEventListener("dblclick", async () => {
      if (playlist.canciones.length > 0) {
        setQueue(
          playlist.canciones.map((song) => ({
            ...song,
            artistName: song.artistName || "Playlist",
            albumCover: song.albumCover || playlist.portada,
            originalAlbumIdx: song.originalAlbumIdx,
          })),
          0,
        );
        playActiveSong();
      } else {
        await showAlert("Esta playlist no tiene canciones.", "Playlist vacía");
      }
    });
    DOM.sidebar.playlistsContainer.appendChild(link);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function openPlaylistModal() {
  if (DOM.modal.overlay) DOM.modal.overlay.classList.remove("hidden");
  if (DOM.modal.input) DOM.modal.input.value = "";
  if (DOM.modal.imgInput) DOM.modal.imgInput.value = "";
}

export function closePlaylistModal() {
  if (DOM.modal.overlay) DOM.modal.overlay.classList.add("hidden");
}

export async function createPlaylistAction() {
  const pName = DOM.modal.input?.value.trim();
  if (!pName) return;

  if (state.playlists[pName]) {
    await showAlert(`Ya existe una playlist llamada "${pName}". Elige otro nombre.`, "Nombre duplicado");
    return;
  }

  const file = DOM.modal.imgInput?.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => completePlaylistCreation(pName, e.target.result);
    reader.readAsDataURL(file);
  } else {
    completePlaylistCreation(pName, "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400");
  }
}

function completePlaylistCreation(name, coverSrc) {
  if (!state.playlists[name]) {
    state.playlists[name] = { canciones: [], portada: coverSrc };
    saveState();
    renderPlaylistsSidebarLinks();
    renderAlbumCards();
    closePlaylistModal();
  }
}

// Edición de playlist (parte del modal de edición)
export function openEditPlaylistModal() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) return;
  const playlist = state.playlists[playlistName];
  if (!playlist) return;
  if (DOM.editAlbumModal.headerTitle) DOM.editAlbumModal.headerTitle.innerText = "Editar Playlist";
  if (DOM.editAlbumModal.lblTitle) DOM.editAlbumModal.lblTitle.innerText = "Nombre de la Playlist";
  if (DOM.editAlbumModal.artistGroup) DOM.editAlbumModal.artistGroup.style.display = "none";
  if (DOM.editAlbumModal.inputTitle) DOM.editAlbumModal.inputTitle.value = playlistName;
  if (DOM.editAlbumModal.inputCover) DOM.editAlbumModal.inputCover.value = playlist.portada;
  window.editAlbumTempSongs = playlist.canciones.map((s) => ({ ...s }));
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.remove("hidden");
}

export function confirmEditPlaylistChanges(oldName, nextName, nextCover, tempSongs) {
  const playlist = state.playlists[oldName];
  if (!playlist) return;
  if (nextName !== oldName) {
    state.playlists[nextName] = playlist;
    delete state.playlists[oldName];
    state.activePlaylistName = nextName;
  }
  state.playlists[nextName].portada = nextCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
  state.playlists[nextName].canciones = tempSongs.map((s) => ({
    trackTitle: s.trackTitle || "Pista sin título",
    file: s.file,
    artistName: s.artistName || "Desconocido",
    albumCover: nextCover || s.albumCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400",
    originalAlbumIdx: s.originalAlbumIdx,
  }));
  saveState();
  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  showSection(`playlist:${nextName}`);
}

export async function deleteActivePlaylist() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) return;
  const confirmed = await showConfirm(`¿Eliminar playlist "${playlistName}"?`, "Eliminar playlist", "Eliminar", "Cancelar", true);
  if (confirmed) {
    delete state.playlists[playlistName];
    saveState();
    renderPlaylistsSidebarLinks();
    renderAlbumCards();
    showSection("home");
  }
}
