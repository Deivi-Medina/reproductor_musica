// js/playlist.js
import DOM, { state, loadInitialData } from "./var.js";
import { showSection } from "./navigation.js";
import { renderAlbumCards, refreshUI as refreshUIFromUi } from "./ui.js";
import { setQueue, playActiveSong } from "./audio.js";
import { showAlert, showConfirm } from "./modals.js";
import { createPlaylist, updatePlaylist, deletePlaylist } from "./services/playlistService.js";

window.tempCoverFile = null;

async function refreshUI() {
  await loadInitialData();
  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  if (window.lucide) window.lucide.createIcons();
}

export function renderPlaylistsSidebarLinks() {
  if (!DOM.sidebar.playlistsContainer) return;
  DOM.sidebar.playlistsContainer.innerHTML = "";
  const playlists = state.playlists || {};
  Object.keys(playlists).forEach((pName) => {
    const playlist = playlists[pName];
    const link = document.createElement("button");
    link.className = "playlist-link";
    link.dataset.name = pName;
    link.innerHTML = `<i data-lucide="music"></i> <span>${escapeHtml(pName)}</span>`;
    link.addEventListener("click", () => showSection(`playlist:${pName}`));
    link.addEventListener("dblclick", async () => {
      if (playlist.canciones && playlist.canciones.length > 0) {
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
  if (state.playlists && state.playlists[pName]) {
    await showAlert(`Ya existe una playlist llamada "${pName}". Elige otro nombre.`, "Nombre duplicado");
    return;
  }
  const file = DOM.modal.imgInput?.files[0];

  try {
    const data = await createPlaylist(pName, file);
    if (data.success) {
      await refreshUI();
      closePlaylistModal();
    } else {
      await showAlert(data.message || "Error al crear la playlist", "Error");
    }
  } catch (error) {
    console.error(error);
    await showAlert("Error de conexión", "Error");
  }
}

export function openEditPlaylistModal() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) return;
  const playlist = state.playlists[playlistName];
  if (!playlist) return;

  window.tempCoverFile = null;
  const preview = document.getElementById("editCoverPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  if (DOM.editAlbumModal.headerTitle) DOM.editAlbumModal.headerTitle.innerText = "Editar Playlist";
  if (DOM.editAlbumModal.lblTitle) DOM.editAlbumModal.lblTitle.innerText = "Nombre de la Playlist";
  if (DOM.editAlbumModal.artistGroup) DOM.editAlbumModal.artistGroup.style.display = "none";
  if (DOM.editAlbumModal.inputTitle) DOM.editAlbumModal.inputTitle.value = playlistName;
  if (DOM.editAlbumModal.inputCover) DOM.editAlbumModal.inputCover.value = playlist.portada;

  window.editAlbumTempSongs = playlist.canciones.map((s) => ({ ...s }));
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.remove("hidden");
}

export async function confirmEditPlaylistChanges(oldName, nextName, nextCover, tempSongs, coverFile = null) {
  const playlist = state.playlists[oldName];
  if (!playlist) return;
  const playlistId = playlist.id_playlist;
  if (!playlistId) {
    await showAlert("Error: playlist sin ID", "Error");
    return;
  }

  const coverFileToSend = coverFile || window.tempCoverFile || null;
  const songIds = tempSongs.map((s) => s.id_cancion).filter((id) => id);

  try {
    const data = await updatePlaylist(playlistId, nextName, coverFileToSend, nextCover, songIds);
    if (data.success) {
      await refreshUI();
      showSection(`playlist:${nextName}`);
      if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.add("hidden");
      window.tempCoverFile = null;
      const preview = document.getElementById("editCoverPreview");
      if (preview) {
        preview.src = "";
        preview.style.display = "none";
      }
    } else {
      await showAlert(data.message || "Error al actualizar playlist", "Error");
    }
  } catch (error) {
    console.error(error);
    await showAlert("Error de conexión", "Error");
  }
}

export async function deleteActivePlaylist() {
  const playlistName = state.activePlaylistName;
  if (!playlistName) return;
  const playlist = state.playlists[playlistName];
  if (!playlist) return;
  const playlistId = playlist.id_playlist;
  if (!playlistId) {
    await showAlert("Error: playlist sin ID", "Error");
    return;
  }
  const confirmed = await showConfirm(`¿Eliminar playlist "${playlistName}"?`, "Eliminar playlist", "Eliminar", "Cancelar", true);
  if (confirmed) {
    try {
      const data = await deletePlaylist(playlistId);
      if (data.success) {
        await refreshUI();
        showSection("home");
      } else {
        await showAlert(data.message || "Error al eliminar playlist", "Error");
      }
    } catch (error) {
      console.error(error);
      await showAlert("Error de conexión", "Error");
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
