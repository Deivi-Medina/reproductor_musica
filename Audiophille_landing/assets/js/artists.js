// js/artists.js
import DOM, { state, saveFollowedArtistsToAPI } from "./var.js";
import { showSection } from "./navigation.js";
import { openAlbumView } from "./ui.js";

// Inicializar followedArtists desde la API (se cargará en loadInitialData)
if (!state.followedArtists) {
  state.followedArtists = []; // Se llenará después con datos de la API
}

// Función para obtener álbumes desde la variable global (cargada desde API)
function getAlbums() {
  return window.albumsFromDB || [];
}

export async function openArtistProfile(artistName) {
  // Cambiar a la sección del artista
  showSection(`artist:${artistName}`);

  const mainContainer = DOM.views.artistProfile;
  if (!mainContainer) return;

  // Forzar visibilidad
  mainContainer.classList.remove("hidden");
  mainContainer.style.display = "block";

  // Obtener álbumes desde los datos globales
  const albums = getAlbums();
  // Filtrar álbumes del artista (coincidencia exacta de nombre)
  const artistAlbums = albums.filter((a) => a.artist === artistName);
  const firstAlbum = artistAlbums[0];
  const isFollowing = state.followedArtists.includes(artistName);

  // Inyectar HTML
  mainContainer.innerHTML = `
        <div class="artist-profile-container" style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
            <button id="btnBackFromArtist" class="back-btn" style="margin-bottom: 1.5rem;">
                ← Volver a la Biblioteca
            </button>
            <div class="artist-profile-banner" style="position: relative; padding: 4rem 2rem 2rem; border-radius: 24px; overflow: hidden; margin-bottom: 2rem;">
                <div class="artist-banner-blur" style="position: absolute; top:0; left:0; width:100%; height:100%; background: url('${firstAlbum?.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"}') center/cover; filter: blur(16px) brightness(0.4) scale(1.1); z-index: 1;"></div>
                <div class="artist-banner-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(180deg, rgba(2,2,4,0.2) 0%, var(--bg-dark) 100%); z-index: 2;"></div>
                <div class="artist-banner-content" style="position: relative; z-index: 3; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                    <span class="artist-verified-badge" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; color: #a78bfa; font-weight: 600; border: 1px solid rgba(167,139,250,0.2);">
                        ✓ Artista Verificado
                    </span>
                    <h1 class="artist-profile-name" style="font-size: 3rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; margin: 0.5rem 0;">${escapeHtml(artistName)}</h1>
                    <p class="artist-listeners" id="artistListenersCount" style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                        ${isFollowing ? "1,450,231" : "1,450,230"} oyentes mensuales
                    </p>
                    <button id="btnFollowArtist" class="artist-follow-btn ${isFollowing ? "following" : ""}">
                        ${isFollowing ? "✕ Dejar de seguir" : "✓ Seguir"}
                    </button>
                </div>
            </div>
            <div class="artist-profile-body" style="padding: 0 1rem;">
                <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem;">Álbumes y sencillos</h2>
                <div class="album-grid" id="artistAlbumsGrid"></div>
            </div>
        </div>
    `;

  // Listeners
  const btnBack = mainContainer.querySelector("#btnBackFromArtist");
  if (btnBack) btnBack.onclick = () => showSection("home");

  const btnFollow = mainContainer.querySelector("#btnFollowArtist");
  const listenersText = mainContainer.querySelector("#artistListenersCount");
  if (btnFollow) {
    btnFollow.addEventListener("click", async () => {
      const currentlyFollowing = state.followedArtists.includes(artistName);
      let newFollowing = false;
      if (currentlyFollowing) {
        // Dejar de seguir
        state.followedArtists = state.followedArtists.filter((name) => name !== artistName);
        btnFollow.classList.remove("following");
        btnFollow.innerHTML = "✓ Seguir";
        if (listenersText) listenersText.innerText = "1,450,230 oyentes mensuales";
        newFollowing = false;
      } else {
        // Seguir
        state.followedArtists.push(artistName);
        btnFollow.classList.add("following");
        btnFollow.innerHTML = "✕ Dejar de seguir";
        if (listenersText) listenersText.innerText = "1,450,231 oyentes mensuales";
        newFollowing = true;
      }
      // Guardar en el servidor a través de la API
      await saveFollowedArtistsToAPI(artistName, newFollowing);
    });
  }

  // Renderizar álbumes del artista
  const grid = mainContainer.querySelector("#artistAlbumsGrid");
  if (grid) {
    grid.innerHTML = "";
    if (artistAlbums.length === 0) {
      grid.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">No se encontraron álbumes de este artista en tu biblioteca.</p>`;
    } else {
      artistAlbums.forEach((album) => {
        // Encontrar el índice global del álbum para openAlbumView
        const globalIndex = albums.findIndex((a) => a.id_album === album.id_album);
        const card = document.createElement("article");
        card.className = "album-card";
        card.innerHTML = `
                    <div class="card-media-wrapper">
                        <div class="card-media">
                            <img src="${album.cover}" alt="${escapeHtml(album.title)}">
                        </div>
                        <span class="grid-card-tag tag-album">Álbum</span>
                    </div>
                    <div class="card-info">
                        <h3>${escapeHtml(album.title)}</h3>
                        <p>${escapeHtml(album.genre || "Sin género")}</p>
                    </div>
                `;
        card.addEventListener("click", () => openAlbumView(globalIndex));
        grid.appendChild(card);
      });
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// Función auxiliar para escapar HTML (evita inyección XSS)
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}
