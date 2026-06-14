// js/album-crud.js
import albums from "./canciones.js";
import DOM, { saveAllAlbums, state } from "./var.js";
import { renderAlbumCards, openAlbumView } from "./ui.js";
import { showSection } from "./navigation.js";
import { openEditPlaylistModal, confirmEditPlaylistChanges, deleteActivePlaylist } from "./playlist.js";
import { showAlert, showConfirm } from "./modals.js";

let editAlbumTempSongs = [];

export async function openEditAlbumModal() {
  if (state.activePlaylistName) {
    openEditPlaylistModal();
    return;
  }
  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const album = albums[albumIndex];
  if (album.title === "Mis Archivos Importados") {
    await showAlert("Este álbum virtual no se puede editar.", "Información");
    return;
  }
  if (DOM.editAlbumModal.inputTitle) DOM.editAlbumModal.inputTitle.value = album.title;
  if (DOM.editAlbumModal.inputArtist) DOM.editAlbumModal.inputArtist.value = album.artist;
  if (DOM.editAlbumModal.inputCover) DOM.editAlbumModal.inputCover.value = album.cover;
  editAlbumTempSongs = album.songs.map((s) => ({ ...s }));
  renderEditAlbumSongsList();
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.remove("hidden");
}

export function closeEditAlbumModal() {
  if (DOM.editAlbumModal.modal) DOM.editAlbumModal.modal.classList.add("hidden");
  if (DOM.editAlbumModal.headerTitle) DOM.editAlbumModal.headerTitle.innerText = "Editar Álbum";
  if (DOM.editAlbumModal.lblTitle) DOM.editAlbumModal.lblTitle.innerText = "Título del Álbum";
  if (DOM.editAlbumModal.artistGroup) DOM.editAlbumModal.artistGroup.style.display = "block";
}

export function renderEditAlbumSongsList() {
  const container = DOM.editAlbumModal.songsContainer;
  if (!container) return;
  container.innerHTML = "";
  if (editAlbumTempSongs.length === 0) {
    container.innerHTML = `<span style="padding:10px; font-size:12px; color:var(--text-secondary); text-align:center;">No hay canciones.</span>`;
    return;
  }
  editAlbumTempSongs.forEach((song, idx) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.marginBottom = "6px";
    row.innerHTML = `
      <span style="font-size:12px; color:var(--text-secondary); width:20px;">${idx + 1}</span>
      <input type="text" value="${song.trackTitle.replace(/"/g, "&quot;")}" placeholder="Título..." style="flex:1; background:#1c1c24; border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:6px 10px; color:#fff; font-size:13px; outline:none;">
      <button class="btn-delete-temp-song" style="background:rgba(255,69,58,0.1); border:none; color:#ff453a; width:28px; height:28px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
    `;
    const input = row.querySelector("input");
    input.addEventListener("input", (e) => {
      editAlbumTempSongs[idx].trackTitle = e.target.value;
    });
    const btnDel = row.querySelector(".btn-delete-temp-song");
    btnDel.addEventListener("click", () => {
      editAlbumTempSongs.splice(idx, 1);
      renderEditAlbumSongsList();
    });
    container.appendChild(row);
  });
  if (window.lucide) window.lucide.createIcons();
}

export function handleEditAlbumAddLocalSong(file) {
  if (!file) return;
  const fileUrl = URL.createObjectURL(file);
  let rawTitle = file.name;
  const lastDot = rawTitle.lastIndexOf(".");
  if (lastDot > 0) rawTitle = rawTitle.slice(0, lastDot);
  editAlbumTempSongs.push({ trackTitle: rawTitle, file: fileUrl });
  renderEditAlbumSongsList();
}

export async function confirmEditAlbumChanges() {
  if (state.activePlaylistName) {
    const oldName = state.activePlaylistName;
    const nextName = DOM.editAlbumModal.inputTitle?.value.trim();
    const nextCover = DOM.editAlbumModal.inputCover?.value.trim();
    if (!nextName) {
      await showAlert("Nombre de playlist requerido.", "Campo vacío");
      return;
    }
    confirmEditPlaylistChanges(oldName, nextName, nextCover, editAlbumTempSongs);
    return;
  }
  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const nextTitle = DOM.editAlbumModal.inputTitle?.value.trim();
  const nextArtist = DOM.editAlbumModal.inputArtist?.value.trim();
  const nextCover = DOM.editAlbumModal.inputCover?.value.trim();
  if (!nextTitle || !nextArtist) {
    await showAlert("Rellena título y artista.", "Datos incompletos");
    return;
  }
  const album = albums[albumIndex];
  album.title = nextTitle;
  album.artist = nextArtist;
  album.cover = nextCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
  album.songs = editAlbumTempSongs.map((s) => ({ trackTitle: s.trackTitle || "Pista sin título", file: s.file }));
  saveAllAlbums();
  closeEditAlbumModal();
  renderAlbumCards();
  openAlbumView(albumIndex);
}

export async function deleteActiveAlbum() {
  if (state.activePlaylistName) {
    await deleteActivePlaylist();
    return;
  }
  const albumIndex = state.activeAlbumIndex;
  if (albumIndex === null) return;
  const album = albums[albumIndex];
  if (album.title === "Mis Archivos Importados") {
    await showAlert("No se puede eliminar este álbum virtual.", "Operación no permitida");
    return;
  }
  const confirmed = await showConfirm(`¿Eliminar álbum "${album.title}"?`, "Eliminar álbum", "Eliminar", "Cancelar", true);
  if (confirmed) {
    albums.splice(albumIndex, 1);
    saveAllAlbums();
    showSection("home");
  }
}