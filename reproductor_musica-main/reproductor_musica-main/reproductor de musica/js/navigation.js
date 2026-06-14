// js/navigation.js
import DOM, { state } from "./var.js";
import { renderAlbumCards, renderFavoritesDetailView, renderPlaylistDetailView } from "./ui.js";
import { updateDiarySongsSelector, renderIntegratedDiaryFeed } from "./reviews.js";
import { startGame, stopGame } from "./game.js";

export function showSection(section) {
  const previousSection = state.currentSection;

  state.currentSection = section;
  state.activeAlbumIndex = null;
  state.activePlaylistName = section.startsWith("playlist:") ? section.replace("playlist:", "") : null;

  if (DOM.extra.playlistInlineContainer) DOM.extra.playlistInlineContainer.classList.add("hidden");
  if (DOM.sidebar.navHome) DOM.sidebar.navHome.classList.remove("active");
  if (DOM.sidebar.navFavorites) DOM.sidebar.navFavorites.classList.remove("active");
  if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.remove("active");
  if (DOM.sidebar.navGame) DOM.sidebar.navGame.classList.remove("active");
  document.querySelectorAll(".playlist-link").forEach((l) => l.classList.remove("active"));

  // Ocultar todas las vistas principales
  if (DOM.views.library) DOM.views.library.classList.add("hidden");
  if (DOM.views.albumDetail) DOM.views.albumDetail.classList.add("hidden");
  if (DOM.views.diary) DOM.views.diary.classList.add("hidden");
  if (DOM.views.game) DOM.views.game.classList.add("hidden"); // ✅ ahora sí existe

  // Detener juego si se sale de la vista
  if (previousSection === "game" && section !== "game") {
    stopGame();
  }

  if (section === "home") {
    if (DOM.sidebar.navHome) DOM.sidebar.navHome.classList.add("active");
    if (DOM.views.library) DOM.views.library.classList.remove("hidden");
    renderAlbumCards();
  } else if (section === "favorites") {
    if (DOM.sidebar.navFavorites) DOM.sidebar.navFavorites.classList.add("active");
    if (DOM.views.albumDetail) DOM.views.albumDetail.classList.remove("hidden");
    renderFavoritesDetailView();
  } else if (section === "diary") {
    if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.add("active");
    if (DOM.views.diary) {
      DOM.views.diary.classList.remove("hidden");
      updateDiarySongsSelector();
      renderIntegratedDiaryFeed();
    }
  } else if (section === "game") {
    if (DOM.sidebar.navGame) DOM.sidebar.navGame.classList.add("active");
    if (DOM.views.game) {
      DOM.views.game.classList.remove("hidden");
      startGame();
    }
  } else if (section.startsWith("playlist:")) {
    const playlistName = section.replace("playlist:", "");
    const targetElement = [...document.querySelectorAll(".playlist-link")].find((e) => e.dataset.name === playlistName);
    if (targetElement) targetElement.classList.add("active");
    if (DOM.views.albumDetail) DOM.views.albumDetail.classList.remove("hidden");
    renderPlaylistDetailView(playlistName);
  }
}
