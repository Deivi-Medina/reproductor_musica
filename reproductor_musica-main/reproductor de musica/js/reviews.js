// js/reviews.js
import { showAlert, showConfirm } from "./modals.js";

// --- MODELO DE DATOS DE CRÍTICAS (LETTERBOXD FOR SONGS) ---
let reviews = JSON.parse(localStorage.getItem("mg_song_reviews")) || [];
let currentRating = 5;
let currentIntegratedRating = 5;
let currentTab = "current";
let diarySortMethod = "recent";
let diarySearchQuery = "";
let diaryFilterOnlyRewatched = false;
let isIntegratedRewatchActive = false;

let editingReviewId = null;
let currentEditingRating = 5;
let isEditingRewatchActive = false;

let getPlayingTrackGlobal = null;
let getAllTracksInLibraryGlobal = null;

// ✅ SIN RESEÑAS POR DEFECTO – Se inicia con array vacío
if (reviews.length === 0) {
  reviews = [];
  localStorage.setItem("mg_song_reviews", JSON.stringify(reviews));
}

// ================== FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ==================
export function initReviewsSystem(getPlayingTrackFn, getAllTracksInLibraryFn) {
  getPlayingTrackGlobal = getPlayingTrackFn;
  getAllTracksInLibraryGlobal = getAllTracksInLibraryFn;

  // --- ELEMENTOS DE LAS RESEÑAS DE LA BARRA LATERAL ---
  const btnToggleReviews = document.getElementById("btnToggleReviews");
  const reviewsSidebar = document.getElementById("reviewsSidebar");
  const queueSidebar = document.getElementById("queueSidebar");
  const equalizerSidebar = document.getElementById("equalizerSidebar");

  const starContainer = document.getElementById("reviewRatingStars");
  const btnSaveReview = document.getElementById("btnSaveReview");
  const reviewTextInput = document.getElementById("reviewTextInput");

  const btnTabCurrentTrack = document.getElementById("btnTabCurrentTrack");
  const btnTabMyDiary = document.getElementById("btnTabMyDiary");

  // Toggle Sidebar
  if (btnToggleReviews && reviewsSidebar) {
    btnToggleReviews.addEventListener("click", () => {
      reviewsSidebar.classList.toggle("collapsed");
      if (!reviewsSidebar.classList.contains("collapsed")) {
        if (queueSidebar) queueSidebar.classList.add("collapsed");
        if (equalizerSidebar) equalizerSidebar.classList.add("collapsed");
        renderReviews(getPlayingTrackGlobal());
      }
    });
  }

  // Manejo de estrellas en sidebar (click para seleccionar)
  if (starContainer) {
    starContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightStars(currentRating);
      }
    });
  }

  // Pestañas
  if (btnTabCurrentTrack && btnTabMyDiary) {
    btnTabCurrentTrack.addEventListener("click", () => {
      currentTab = "current";
      btnTabCurrentTrack.style.color = "var(--blue-accent)";
      btnTabCurrentTrack.style.borderBottomColor = "var(--blue-accent)";
      btnTabMyDiary.style.color = "var(--text-secondary)";
      btnTabMyDiary.style.borderBottomColor = "transparent";
      renderReviews(getPlayingTrackGlobal());
    });

    btnTabMyDiary.addEventListener("click", () => {
      currentTab = "diary";
      btnTabMyDiary.style.color = "var(--blue-accent)";
      btnTabMyDiary.style.borderBottomColor = "var(--blue-accent)";
      btnTabCurrentTrack.style.color = "var(--text-secondary)";
      btnTabCurrentTrack.style.borderBottomColor = "transparent";
      renderReviews(getPlayingTrackGlobal());
    });
  }

  // Guardar reseña desde sidebar
  if (btnSaveReview && reviewTextInput) {
    btnSaveReview.addEventListener("click", async () => {
      const text = reviewTextInput.value.trim();
      const track = getPlayingTrackGlobal();

      if (!track) {
        await showAlert("Debes reproducir una canción antes de escribir una crítica.", "Sin reproducción");
        return;
      }

      if (!text) {
        await showAlert("Por favor escribe tu reseña.", "Texto vacío");
        return;
      }

      saveReview(track.trackTitle, track.artistName, track.albumCover, currentRating, text, false);
      reviewTextInput.value = "";
      currentRating = 5;
      highlightStars(5);
    });
  }

  highlightStars(5);

  // --- SISTEMA INTEGRADO DE DIARIO ---
  const integratedStarsContainer = document.getElementById("integratedRatingStars");
  const btnSaveIntegratedReview = document.getElementById("btnSaveIntegratedReview");
  const integratedReviewText = document.getElementById("integratedReviewText");
  const btnSetCurrentPlaying = document.getElementById("btnSetCurrentPlayingToComposer");

  const btnSortRecent = document.getElementById("btnDiarySortRecent");
  const btnSortRating = document.getElementById("btnDiarySortRating");

  if (integratedStarsContainer) {
    integratedStarsContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentIntegratedRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightIntegratedStars(currentIntegratedRating);
      }
    });
  }

  if (btnSetCurrentPlaying) {
    btnSetCurrentPlaying.addEventListener("click", () => {
      const track = getPlayingTrackGlobal();
      if (!track) {
        alert("No hay ninguna pista en reproducción actualmente.");
        return;
      }
      selectTrackInComposerDropdown(track.trackTitle);
    });
  }

  const btnDiaryRewatchToggle = document.getElementById("btnDiaryRewatchToggle");
  if (btnDiaryRewatchToggle) {
    btnDiaryRewatchToggle.addEventListener("click", () => {
      isIntegratedRewatchActive = !isIntegratedRewatchActive;
      if (isIntegratedRewatchActive) {
        btnDiaryRewatchToggle.style.background = "rgba(0, 224, 84, 0.1)";
        btnDiaryRewatchToggle.style.borderColor = "rgba(0, 224, 84, 0.35)";
        btnDiaryRewatchToggle.style.color = "#00e054";
      } else {
        btnDiaryRewatchToggle.style.background = "rgba(255,255,255,0.04)";
        btnDiaryRewatchToggle.style.borderColor = "rgba(255,255,255,0.08)";
        btnDiaryRewatchToggle.style.color = "#a0a0a8";
      }
    });
  }

  if (btnSaveIntegratedReview && integratedReviewText) {
    btnSaveIntegratedReview.addEventListener("click", async () => {
      const selectEl = document.getElementById("diarySongSelector");
      if (!selectEl || !selectEl.value) {
        await showAlert("Selecciona primero una canción de la biblioteca o sube pistas locales.", "Canción no seleccionada");
        return;
      }

      const text = integratedReviewText.value.trim();
      if (!text) {
        await showAlert("Por favor, escribe tus pensamientos o crítica.", "Comentario vacío");
        return;
      }

      try {
        const trackData = JSON.parse(selectEl.value);
        saveReview(
          trackData.trackTitle,
          trackData.artistName,
          trackData.albumCover,
          currentIntegratedRating,
          text,
          isIntegratedRewatchActive,
        );
        integratedReviewText.value = "";
        currentIntegratedRating = 5;
        highlightIntegratedStars(5);
      } catch (err) {
        console.error("Error leyendo metadatos de selección:", err);
      }
    });
  }

  // Filtros y ordenamiento
  const diarySearchFilter = document.getElementById("diarySearchFilter");
  if (diarySearchFilter) {
    diarySearchFilter.addEventListener("input", (e) => {
      diarySearchQuery = e.target.value;
      renderIntegratedDiaryFeed();
    });
  }

  const btnDiaryFilterRewatched = document.getElementById("btnDiaryFilterRewatched");
  if (btnDiaryFilterRewatched) {
    btnDiaryFilterRewatched.addEventListener("click", () => {
      diaryFilterOnlyRewatched = !diaryFilterOnlyRewatched;
      if (diaryFilterOnlyRewatched) {
        btnDiaryFilterRewatched.style.background = "rgba(0, 224, 84, 0.1)";
        btnDiaryFilterRewatched.style.borderColor = "rgba(0, 224, 84, 0.35)";
        btnDiaryFilterRewatched.style.color = "#00e054";
      } else {
        btnDiaryFilterRewatched.style.background = "rgba(255, 255, 255, 0.02)";
        btnDiaryFilterRewatched.style.borderColor = "rgba(255, 255, 255, 0.08)";
        btnDiaryFilterRewatched.style.color = "var(--text-secondary)";
      }
      renderIntegratedDiaryFeed();
    });
  }

  if (btnSortRecent) {
    btnSortRecent.addEventListener("click", () => {
      diarySortMethod = "recent";
      btnSortRecent.style.background = "rgba(0, 122, 255, 0.15)";
      btnSortRecent.style.borderColor = "rgba(0, 122, 255, 0.45)";
      btnSortRecent.style.color = "#fff";
      if (btnSortRating) {
        btnSortRating.style.background = "none";
        btnSortRating.style.borderColor = "transparent";
        btnSortRating.style.color = "var(--text-secondary)";
      }
      renderIntegratedDiaryFeed();
    });
  }

  if (btnSortRating) {
    btnSortRating.addEventListener("click", () => {
      diarySortMethod = "rating";
      btnSortRating.style.background = "rgba(0, 122, 255, 0.15)";
      btnSortRating.style.borderColor = "rgba(0, 122, 255, 0.45)";
      btnSortRating.style.color = "#fff";
      if (btnSortRecent) {
        btnSortRecent.style.background = "none";
        btnSortRecent.style.borderColor = "transparent";
        btnSortRecent.style.color = "var(--text-secondary)";
      }
      renderIntegratedDiaryFeed();
    });
  }

  // --- MODAL DE EDICIÓN ---
  const editReviewModal = document.getElementById("editReviewModal");
  const btnEditReviewClose = document.getElementById("btnEditReviewClose");
  const btnEditReviewCancel = document.getElementById("btnEditReviewCancel");
  const btnEditReviewConfirm = document.getElementById("btnEditReviewConfirm");
  const editReviewStarsContainer = document.getElementById("editReviewStars");
  const btnEditReviewRewatchToggle = document.getElementById("btnEditReviewRewatchToggle");

  if (btnEditReviewClose) {
    btnEditReviewClose.addEventListener("click", () => {
      if (editReviewModal) editReviewModal.classList.add("hidden");
    });
  }
  if (btnEditReviewCancel) {
    btnEditReviewCancel.addEventListener("click", () => {
      if (editReviewModal) editReviewModal.classList.add("hidden");
    });
  }
  if (editReviewStarsContainer) {
    editReviewStarsContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentEditingRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightEditStars(currentEditingRating);
      }
    });
  }
  if (btnEditReviewRewatchToggle) {
    btnEditReviewRewatchToggle.addEventListener("click", () => {
      isEditingRewatchActive = !isEditingRewatchActive;
      if (isEditingRewatchActive) {
        btnEditReviewRewatchToggle.style.background = "rgba(0, 224, 84, 0.1)";
        btnEditReviewRewatchToggle.style.borderColor = "rgba(0, 224, 84, 0.35)";
        btnEditReviewRewatchToggle.style.color = "#00e054";
      } else {
        btnEditReviewRewatchToggle.style.background = "rgba(255,255,255,0.04)";
        btnEditReviewRewatchToggle.style.borderColor = "rgba(255,255,255,0.08)";
        btnEditReviewRewatchToggle.style.color = "#a0a0a8";
      }
    });
  }
  if (btnEditReviewConfirm) {
    btnEditReviewConfirm.addEventListener("click", async () => {
      const textEl = document.getElementById("editReviewTextarea");
      const text = textEl ? textEl.value.trim() : "";
      if (!text) {
        await showAlert("Escribe tus opiniones de la canción para poder guardarlas.", "Crítica vacía");
        return;
      }

      const targetRev = reviews.find((r) => r.id === editingReviewId);
      if (targetRev) {
        targetRev.text = text;
        targetRev.rating = currentEditingRating;
        targetRev.rewatch = isEditingRewatchActive;
        localStorage.setItem("mg_song_reviews", JSON.stringify(reviews));

        renderReviews(getPlayingTrackGlobal());
        renderIntegratedDiaryFeed();

        if (editReviewModal) editReviewModal.classList.add("hidden");
      }
    });
  }

  window.openEditReviewModal = function (id) {
    const rev = reviews.find((r) => r.id === id);
    if (!rev) return;

    editingReviewId = id;
    currentEditingRating = rev.rating || 5;
    isEditingRewatchActive = !!rev.rewatch;

    const coverEl = document.getElementById("editReviewTrackCover");
    const titleEl = document.getElementById("editReviewTrackTitle");
    const artistEl = document.getElementById("editReviewTrackArtist");
    const textEl = document.getElementById("editReviewTextarea");

    if (coverEl) coverEl.src = rev.albumCover || "";
    if (titleEl) titleEl.innerText = rev.trackTitle || "";
    if (artistEl) artistEl.innerText = rev.artistName || "";
    if (textEl) textEl.value = rev.text || "";

    highlightEditStars(currentEditingRating);

    if (btnEditReviewRewatchToggle) {
      if (isEditingRewatchActive) {
        btnEditReviewRewatchToggle.style.background = "rgba(0, 224, 84, 0.1)";
        btnEditReviewRewatchToggle.style.borderColor = "rgba(0, 224, 84, 0.35)";
        btnEditReviewRewatchToggle.style.color = "#00e054";
      } else {
        btnEditReviewRewatchToggle.style.background = "rgba(255,255,255,0.04)";
        btnEditReviewRewatchToggle.style.borderColor = "rgba(255,255,255,0.08)";
        btnEditReviewRewatchToggle.style.color = "#a0a0a8";
      }
    }

    if (editReviewModal) editReviewModal.classList.remove("hidden");
  };

  // Exponer cálculo de artista favorito
  exposeTopArtistCalculator();

  // Render inicial
  renderReviews(getPlayingTrackGlobal());
  renderIntegratedDiaryFeed();
  highlightIntegratedStars(5);
}

// ================== FUNCIONES AUXILIARES ==================

function exposeTopArtistCalculator() {
  window.obtenerArtistaMasEscuchadoYValorado = function () {
    const reproducciones = JSON.parse(localStorage.getItem("mg_artist_plays")) || {};
    const reseñas = JSON.parse(localStorage.getItem("mg_song_reviews")) || [];

    const ratingsPorArtista = {};
    reseñas.forEach((rev) => {
      if (!rev.artistName) return;
      const artista = rev.artistName.trim();
      if (!ratingsPorArtista[artista]) {
        ratingsPorArtista[artista] = { suma: 0, cuenta: 0 };
      }
      ratingsPorArtista[artista].suma += parseFloat(rev.rating || 0);
      ratingsPorArtista[artista].cuenta += 1;
    });

    const todosLosArtistas = new Set([...Object.keys(reproducciones), ...Object.keys(ratingsPorArtista)]);

    let mejorArtista = "Ninguno todavía";
    let maxPuntuacion = -1;
    let estadisticasMejor = { plays: 0, ratingPromedio: 0 };

    todosLosArtistas.forEach((artista) => {
      const cantPlays = reproducciones[artista] || 0;
      let promedioEstrellas = 0;
      if (ratingsPorArtista[artista] && ratingsPorArtista[artista].cuenta > 0) {
        promedioEstrellas = ratingsPorArtista[artista].suma / ratingsPorArtista[artista].cuenta;
      }

      const puntuacionFinal = cantPlays * 1 + promedioEstrellas * 3;

      if (puntuacionFinal > maxPuntuacion && puntuacionFinal > 0) {
        maxPuntuacion = puntuacionFinal;
        mejorArtista = artista;
        estadisticasMejor = { plays: cantPlays, ratingPromedio: promedioEstrellas.toFixed(1) };
      }
    });

    return {
      artista: mejorArtista,
      puntuacion: maxPuntuacion.toFixed(1),
      reproducciones: estadisticasMejor.plays,
      ratingPromedio: estadisticasMejor.ratingPromedio,
    };
  };
}

// Función para aplicar el efecto hover a las estrellas mediante JS
function applyStarHoverEffect(starElement) {
  if (!starElement) return;
  // Guardar estilo original
  const originalTransform = starElement.style.transform;
  const originalFilter = starElement.style.filter;

  starElement.addEventListener("mouseenter", () => {
    starElement.style.transform = "scale(1.35) rotate(4deg)";
    starElement.style.filter = "drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))";
    starElement.style.transition = "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease";
  });
  starElement.addEventListener("mouseleave", () => {
    starElement.style.transform = "";
    starElement.style.filter = "";
  });
}

// Función para aplicar hover a todas las estrellas dentro de un contenedor
function setupStarHoverEffects(container) {
  if (!container) return;
  const stars = container.querySelectorAll("i[data-value]");
  stars.forEach((star) => {
    // Aplicamos el efecto al SVG o al i (según qué elemento tenga el transform)
    // Normalmente el <i> no tiene tamaño, así que aplicamos al SVG
    const svg = star.querySelector("svg");
    if (svg) {
      applyStarHoverEffect(svg);
    } else {
      // Fallback: aplicar al i
      applyStarHoverEffect(star);
    }
  });
}

function highlightStars(rating) {
  const starContainer = document.getElementById("reviewRatingStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  // Aplicar hover a las estrellas recién renderizadas
  setupStarHoverEffects(starContainer);
}

function highlightIntegratedStars(rating) {
  const starContainer = document.getElementById("integratedRatingStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  setupStarHoverEffects(starContainer);
}

function highlightEditStars(rating) {
  const starContainer = document.getElementById("editReviewStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  setupStarHoverEffects(starContainer);
}

export function selectTrackInComposerDropdown(trackTitle) {
  const selectEl = document.getElementById("diarySongSelector");
  if (!selectEl) return;

  for (let i = 0; i < selectEl.options.length; i++) {
    try {
      const optVal = JSON.parse(selectEl.options[i].value);
      if (optVal.trackTitle.toLowerCase() === trackTitle.toLowerCase()) {
        selectEl.selectedIndex = i;
        break;
      }
    } catch (e) {}
  }
}

function saveReview(trackTitle, artistName, albumCover, rating, text, rewatch = false) {
  const newRev = {
    id: "rev_" + Date.now(),
    trackTitle: trackTitle,
    artistName: artistName,
    albumCover: albumCover,
    rating: rating,
    text: text,
    rewatch: rewatch,
    timestamp: Date.now(),
  };

  reviews.unshift(newRev);
  localStorage.setItem("mg_song_reviews", JSON.stringify(reviews));

  isIntegratedRewatchActive = false;
  const btnDiaryRewatchToggle = document.getElementById("btnDiaryRewatchToggle");
  if (btnDiaryRewatchToggle) {
    btnDiaryRewatchToggle.style.background = "rgba(255,255,255,0.04)";
    btnDiaryRewatchToggle.style.borderColor = "rgba(255,255,255,0.08)";
    btnDiaryRewatchToggle.style.color = "#a0a0a8";
  }

  const playingTrack = getPlayingTrackGlobal ? getPlayingTrackGlobal() : null;
  renderReviews(playingTrack);
  renderIntegratedDiaryFeed();
}

export function updateDiarySongsSelector() {
  const selector = document.getElementById("diarySongSelector");
  if (!selector || !getAllTracksInLibraryGlobal) return;

  selector.innerHTML = "";
  const tracksList = getAllTracksInLibraryGlobal();

  if (tracksList.length === 0) {
    const opt = document.createElement("option");
    opt.innerText = "No hay canciones cargadas.";
    opt.value = "";
    selector.appendChild(opt);
    return;
  }

  tracksList.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = JSON.stringify({
      trackTitle: t.trackTitle,
      artistName: t.artistName,
      albumCover: t.albumCover,
    });
    opt.innerText = `${t.trackTitle} - ${t.artistName}`;
    selector.appendChild(opt);
  });
}

function updateStateStats() {
  const totalEl = document.getElementById("statTotalReviews");
  const avgEl = document.getElementById("statAvgRating");
  const favArtistEl = document.getElementById("statFavArtist");

  if (totalEl) totalEl.innerText = reviews.length;

  if (avgEl) {
    if (reviews.length === 0) {
      avgEl.innerText = "0.0 ★";
    } else {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / reviews.length;
      avgEl.innerText = `${avg.toFixed(1)} ★`;
    }
  }

  if (favArtistEl) {
    if (window.obtenerArtistaMasEscuchadoYValorado) {
      const resultado = window.obtenerArtistaMasEscuchadoYValorado();
      favArtistEl.innerText = resultado.artista;
    } else {
      if (reviews.length === 0) {
        favArtistEl.innerText = "-";
      } else {
        const counts = {};
        reviews.forEach((r) => {
          const art = r.artistName || "Varios";
          counts[art] = (counts[art] || 0) + 1;
        });
        let fav = "-";
        let maxCount = -1;
        Object.keys(counts).forEach((art) => {
          if (counts[art] > maxCount) {
            maxCount = counts[art];
            fav = art;
          }
        });
        favArtistEl.innerText = fav;
      }
    }
  }
}

export function renderIntegratedDiaryFeed() {
  updateStateStats();

  const container = document.getElementById("integratedDiaryList");
  if (!container) return;

  container.innerHTML = "";

  let displayList = [...reviews];

  if (diarySearchQuery) {
    const query = diarySearchQuery.toLowerCase().trim();
    displayList = displayList.filter(
      (r) =>
        (r.trackTitle && r.trackTitle.toLowerCase().includes(query)) ||
        (r.artistName && r.artistName.toLowerCase().includes(query)) ||
        (r.text && r.text.toLowerCase().includes(query)),
    );
  }

  if (diaryFilterOnlyRewatched) {
    displayList = displayList.filter((r) => !!r.rewatch);
  }

  if (diarySortMethod === "rating") {
    displayList.sort((a, b) => b.rating - a.rating || b.timestamp - a.timestamp);
  } else {
    displayList.sort((a, b) => b.timestamp - a.timestamp);
  }

  if (displayList.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: var(--text-secondary); background: rgba(255,255,255,0.01); border: 1px dashed var(--glass-border); border-radius: 16px;">
        <i data-lucide="book-open" style="width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.3; color: var(--blue-accent);"></i>
        <h4 style="font-size: 16px; color:#fff; font-weight: 600;">Ninguna coincidencia encontrada</h4>
        <p style="font-size: 13px; margin-top: 4px;">Prueba ajustando tus filtros o escribe una nueva crítica.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  displayList.forEach((rev) => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.style.background = "rgba(10, 10, 15, 0.4)";
    item.style.borderRadius = "16px";
    item.style.padding = "20px";
    item.style.border = "1px solid var(--glass-border)";
    item.style.display = "grid";
    item.style.gridTemplateColumns = "56px 1fr";
    item.style.gap = "16px";

    let starsHTML = "";
    const fullStars = Math.floor(rev.rating);
    const hasHalf = rev.rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starsHTML += `<i data-lucide="star" fill="#ffd700" style="color: #ffd700; width: 14px; height: 14px;"></i>`;
      } else if (i === fullStars + 1 && hasHalf) {
        starsHTML += `<span style="position:relative; display:inline-block; width:14px; height:14px;">
          <i data-lucide="star" style="color:rgba(255,255,255,0.15); width:14px; height:14px; position:absolute; left:0; top:0;"></i>
          <span style="position:absolute; left:0; top:0; width:50%; overflow:hidden;">
            <i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:14px; height:14px;"></i>
          </span>
        </span>`;
      } else {
        starsHTML += `<i data-lucide="star" style="color:rgba(255,255,255,0.15); width:14px; height:14px;"></i>`;
      }
    }
    if (rev.rewatch) {
      starsHTML += `<i data-lucide="repeat" style="color:#00e054; width:14px; height:14px; margin-left:6px;" title="Re-escuchada"></i>`;
    }

    const dateStr = formatTimeAgo(rev.timestamp);

    item.innerHTML = `
      <img src="${rev.albumCover}" style="width:56px; height:56px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div>
            <h4 style="font-size:15px; font-weight:700; color:#fff;">${rev.trackTitle}</h4>
            <p style="font-size:12px; color:var(--text-secondary);">de <span style="color:#fff;">${rev.artistName}</span></p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:12px;">${dateStr}</span>
            <button class="btn-edit-integrated-review" data-id="${rev.id}" style="background:none; border:none; color:rgba(0,122,255,0.7); cursor:pointer; padding:6px; border-radius:50%;">
              <i data-lucide="pencil" style="width:14px; height:14px;"></i>
            </button>
            <button class="btn-delete-integrated-review" data-id="${rev.id}" style="background:none; border:none; color:rgba(255,69,58,0.5); cursor:pointer; padding:6px; border-radius:50%;">
              <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
            </button>
          </div>
        </div>
        <div style="display:flex; gap:2px; align-items:center;">${starsHTML}</div>
        <p style="font-size:13.5px; color:#e4e4e7; line-height:1.6; border-left:2px solid var(--blue-accent); padding-left:12px;">${rev.text}</p>
      </div>
    `;

    item.querySelector(".btn-delete-integrated-review")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteReview(rev.id, getPlayingTrackGlobal ? getPlayingTrackGlobal() : null);
    });
    item.querySelector(".btn-edit-integrated-review")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.openEditReviewModal(rev.id);
    });

    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
  // Aplicar efectos hover a las estrellas del diario (dentro de las reseñas)
  const diaryStarsContainers = document.querySelectorAll(".diary-stars-input, #integratedRatingStars");
  diaryStarsContainers.forEach((container) => setupStarHoverEffects(container));
}

export function renderReviews(playingTrack) {
  const container = document.getElementById("reviewsList");
  if (!container) return;
  container.innerHTML = "";

  let filtered = [];
  if (currentTab === "current") {
    if (!playingTrack) {
      container.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-secondary);">Reproduce una canción para ver sus críticas.</div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    filtered = reviews.filter((r) => r.trackTitle.toLowerCase() === playingTrack.trackTitle.toLowerCase());
  } else {
    filtered = reviews;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-secondary);">Aún no hay críticas. ¡Sé el primero!</div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  filtered.forEach((rev) => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.style.background = "rgba(255,255,255,0.03)";
    item.style.borderRadius = "10px";
    item.style.padding = "10px";
    item.style.border = "1px solid rgba(255,255,255,0.05)";
    item.style.display = "flex";
    item.style.flexDirection = "column";
    item.style.gap = "6px";

    let starHTML = "";
    const fullStars = Math.floor(rev.rating);
    const hasHalf = rev.rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starHTML += `<i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:12px; height:12px;"></i>`;
      } else if (i === fullStars + 1 && hasHalf) {
        starHTML += `<span style="position:relative; display:inline-block; width:12px; height:12px;">
          <i data-lucide="star" style="color:rgba(255,255,255,0.15); width:12px; height:12px; position:absolute; left:0; top:0;"></i>
          <span style="position:absolute; left:0; top:0; width:50%; overflow:hidden;">
            <i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:12px; height:12px;"></i>
          </span>
        </span>`;
      } else {
        starHTML += `<i data-lucide="star" style="color:rgba(255,255,255,0.2); width:12px; height:12px;"></i>`;
      }
    }
    if (rev.rewatch) {
      starHTML += `<i data-lucide="repeat" style="color:#00e054; width:12px; height:12px; margin-left:4px;" title="Re-escuchada"></i>`;
    }

    const timeStr = formatTimeAgo(rev.timestamp);

    item.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center;">
        <img src="${rev.albumCover}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;">
        <div style="flex:1; overflow:hidden;">
          <h4 style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:white;">${rev.trackTitle}</h4>
          <p style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${rev.artistName}</p>
        </div>
        <div style="display:flex; gap:4px;">
          <button class="btn-edit-review" data-id="${rev.id}" style="background:none; border:none; color:rgba(0,122,255,0.8); cursor:pointer; padding:4px; border-radius:50%;">
            <i data-lucide="pencil" style="width:12px; height:12px;"></i>
          </button>
          <button class="btn-delete-review" data-id="${rev.id}" style="background:none; border:none; color:rgba(255,69,58,0.6); cursor:pointer; padding:4px; border-radius:50%;">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; gap:2px;">${starHTML}</div>
        <span style="font-size:10px; color:var(--text-secondary);">${timeStr}</span>
      </div>
      <p style="font-size:12px; color:#e4e4e7; line-height:1.4;">${rev.text}</p>
    `;

    item.querySelector(".btn-delete-review")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteReview(rev.id, playingTrack);
    });
    item.querySelector(".btn-edit-review")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.openEditReviewModal(rev.id);
    });

    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
  // Aplicar efectos hover a las estrellas de la barra lateral
  const sidebarStars = document.getElementById("reviewRatingStars");
  if (sidebarStars) setupStarHoverEffects(sidebarStars);
}

async function deleteReview(id, playingTrack) {
  const confirmed = await showConfirm(
    "¿Estás seguro de que quieres eliminar esta reseña?",
    "Eliminar reseña",
    "Eliminar",
    "Cancelar",
    true,
  );
  if (confirmed) {
    reviews = reviews.filter((r) => r.id !== id);
    localStorage.setItem("mg_song_reviews", JSON.stringify(reviews));
    renderReviews(playingTrack);
    renderIntegratedDiaryFeed();
  }
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} m`;
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${days} d`;
}
