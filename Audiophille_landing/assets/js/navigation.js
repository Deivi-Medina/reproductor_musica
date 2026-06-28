// js/navigation.js
import DOM, { state } from "./var.js";
import { renderAlbumCards, renderFavoritesDetailView, renderPlaylistDetailView } from "./ui.js";
import { updateDiarySongsSelector, renderIntegratedDiaryFeed } from "./reviews.js";
import { startGame, stopGame } from "./game.js";
import { loadFeed, setupFeedInfiniteScroll } from "./social/feed.js";
import { loadExploreUsers, setupExploreInfiniteScroll } from "./social/explore.js";

export function showSection(section) {
  const previousSection = state.currentSection;

  // 👇 LIMPIAR ESTADO DE PLAYLIST ACTIVA AL SALIR
  if (section !== "playlist" && !section.startsWith("playlist:")) {
    state.activePlaylistName = null;
  }

  // Ocultar todas las vistas
  const allViews = [
    DOM.views.library,
    DOM.views.albumDetail,
    DOM.views.diary,
    DOM.views.game,
    DOM.views.profile,
    DOM.views.community,
    DOM.views.artistProfile,
    DOM.views.publicProfile,
  ];
  allViews.forEach((view) => {
    if (view) view.classList.add("hidden");
  });

  // Quitar active de todos los botones del sidebar
  const navItems = [
    DOM.sidebar.navHome,
    DOM.sidebar.navFavorites,
    DOM.sidebar.navDiary,
    DOM.sidebar.navGame,
    DOM.sidebar.navProfile,
    DOM.sidebar.navCommunity,
  ];
  navItems.forEach((item) => {
    if (item) item.classList.remove("active");
  });

  document.querySelectorAll(".playlist-link").forEach((link) => {
    link.classList.remove("active");
  });

  // Sección específica
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
  } else if (section === "profile") {
    if (DOM.sidebar.navProfile) DOM.sidebar.navProfile.classList.add("active");
    if (DOM.views.profile) {
      DOM.views.profile.classList.remove("hidden");
      if (typeof window.loadProfileData === "function") window.loadProfileData();
    }
  } else if (section === "community") {
    if (DOM.sidebar.navCommunity) DOM.sidebar.navCommunity.classList.add("active");
    if (DOM.views.community) {
      DOM.views.community.classList.remove("hidden");
      setTimeout(() => {
        if (typeof loadFeed === "function") {
          loadFeed(true);
          setTimeout(setupFeedInfiniteScroll, 300);
        }
      }, 100);
    }
  } else if (section.startsWith("profile:")) {
    // Perfil público manejado por profiles.js
  } else if (section.startsWith("playlist:")) {
    const playlistName = section.replace("playlist:", "");
    state.activePlaylistName = playlistName;

    // Marcar el link activo
    document.querySelectorAll(".playlist-link").forEach((link) => {
      if (link.dataset.name === playlistName) {
        link.classList.add("active");
      }
    });

    if (DOM.views.albumDetail) {
      DOM.views.albumDetail.classList.remove("hidden");
    }
    renderPlaylistDetailView(playlistName);
  } else if (section.startsWith("artist:")) {
    if (DOM.views.artistProfile) DOM.views.artistProfile.classList.remove("hidden");
  }

  // Detener juego si se sale
  if (previousSection === "game" && section !== "game") {
    stopGame();
  }

  state.currentSection = section;
}
