// assets/js/social/feed.js
let feedOffset = 0;
const FEED_LIMIT = 20;
let isLoading = false;
let hasMore = true;
let currentFilter = "all";
let feedObserver = null;

export async function loadFeed(reset = true) {
  if (isLoading) return;

  const container = document.getElementById("feedList");
  const loader = document.getElementById("feedLoader");
  const end = document.getElementById("feedEnd");
  const empty = document.getElementById("feedEmpty");

  // Si no existe el contenedor, salir
  if (!container) {
    console.warn("⚠️ feedList no encontrado en el DOM");
    return;
  }

  if (reset) {
    feedOffset = 0;
    hasMore = true;
    container.innerHTML = "";
    if (end) end.classList.add("hidden");
    // Mostrar estado de carga inicial
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "feedLoadingState";
    loadingDiv.className = "feed-loading-state";
    loadingDiv.innerHTML = `<div class="loading-spinner"></div><span>Cargando feed...</span>`;
    container.appendChild(loadingDiv);
  }

  isLoading = true;
  if (loader) loader.classList.remove("hidden");

  try {
    const url = `${window.baseUrl}api.php?action=get_feed&limit=${FEED_LIMIT}&offset=${feedOffset}&filter=${currentFilter}`;
    const response = await fetch(url, { credentials: "include" });
    const data = await response.json();

    // Remover estado de carga
    const loadingState = document.getElementById("feedLoadingState");
    if (loadingState) loadingState.remove();

    if (!data.success) {
      if (reset) {
        container.innerHTML = `<div class="feed-error">⚠️ ${data.message || "Error al cargar el feed"}</div>`;
      }
      return;
    }

    // Si no hay publicaciones
    if (data.feed.length === 0) {
      if (reset) {
        container.innerHTML = `
                    <div class="feed-empty">
                        <i data-lucide="users" class="feed-empty-icon"></i>
                        <h3>Tu feed está vacío</h3>
                        <p>Sigue a otros usuarios para ver su actividad aquí</p>
                        <button class="btn-primary feed-empty-btn" onclick="document.querySelector('[data-tab=\\'explore\\']')?.click()">
                            <i data-lucide="compass"></i> Explorar usuarios
                        </button>
                    </div>
                `;
        if (window.lucide) window.lucide.createIcons();
      }
      hasMore = false;
      if (end) end.classList.add("hidden");
      return;
    }

    // Si hay publicaciones, ocultar el mensaje vacío
    if (empty) empty.classList.add("hidden");

    // Renderizar cada publicación
    data.feed.forEach((item) => {
      const feedItem = createFeedItem(item);
      if (feedItem) {
        container.appendChild(feedItem);
      }
    });

    feedOffset += data.feed.length;
    hasMore = data.feed.length === FEED_LIMIT;

    // Actualizar estado de fin
    if (end) {
      if (hasMore) {
        end.classList.add("hidden");
      } else {
        end.classList.remove("hidden");
      }
    }

    // Recrear iconos Lucide
    if (window.lucide) window.lucide.createIcons();
  } catch (error) {
    console.error("Error al cargar feed:", error);
    // Remover estado de carga si existe
    const loadingState = document.getElementById("feedLoadingState");
    if (loadingState) loadingState.remove();
    if (reset) {
      container.innerHTML = `<div class="feed-error">❌ Error de conexión al cargar el feed</div>`;
    }
  } finally {
    isLoading = false;
    if (loader) loader.classList.add("hidden");
  }
}

/**
 * Crear un elemento DOM para una publicación del feed
 * @param {Object} item - Datos de la publicación
 * @returns {HTMLElement|null} - Elemento DOM o null si hay error
 */
function createFeedItem(item) {
  if (!item || !item.id_usuario) {
    console.warn("Item inválido:", item);
    return null;
  }

  const div = document.createElement("div");
  div.className = "feed-item";

  const avatar = item.avatar
    ? `${window.baseUrl}${item.avatar}`
    : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(item.nombre_usuario || "Usuario")}`;

  const timeAgo = getTimeAgo(new Date(item.fecha));

  let icon = "📌";
  let actionText = "";
  switch (item.tipo_actividad) {
    case "reseña":
      icon = "⭐";
      actionText = "hizo una reseña";
      break;
    case "playlist_creada":
      icon = "📀";
      actionText = "creó una playlist";
      break;
    case "favorito":
      icon = "❤️";
      actionText = "marcó como favorita";
      break;
    case "seguimiento":
      icon = "👤";
      actionText = "comenzó a seguir a";
      break;
    default:
      icon = "📌";
      actionText = "realizó una acción";
  }

  div.innerHTML = `
        <div class="feed-user" onclick="window.openPublicProfile(${item.id_usuario})">
            <img src="${avatar}" class="feed-avatar" alt="${escapeHtml(item.nombre_usuario || "Usuario")}">
            <span class="feed-user-name">${escapeHtml(item.nombre_usuario || "Usuario")}</span>
            <span class="feed-time">${timeAgo}</span>
        </div>
        <div class="feed-action">${icon} ${actionText}</div>
        <div class="feed-description">${escapeHtml(item.descripcion || "")}</div>
    `;

  return div;
}

/**
 * Configurar el scroll infinito para el feed
 */
export function setupFeedInfiniteScroll() {
  const endElement = document.getElementById("feedEnd");
  if (!endElement) {
    console.warn("⚠️ feedEnd no encontrado en el DOM");
    return;
  }

  // Desconectar observer anterior si existe
  if (feedObserver) {
    feedObserver.disconnect();
    feedObserver = null;
  }

  feedObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadFeed(false);
      }
    },
    {
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
    },
  );

  feedObserver.observe(endElement);
}

/**
 * Filtrar el feed por tipo
 */
export function filterFeed(filter) {
  currentFilter = filter;
  loadFeed(true);
}

/**
 * Obtener tiempo relativo
 */
function getTimeAgo(date) {
  if (!date || isNaN(date.getTime())) return "hace un momento";
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "hace " + diff + "s";
  if (diff < 3600) return "hace " + Math.floor(diff / 60) + "m";
  if (diff < 86400) return "hace " + Math.floor(diff / 3600) + "h";
  if (diff < 604800) return "hace " + Math.floor(diff / 86400) + "d";
  return date.toLocaleDateString();
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === '"') return "&quot;";
    return m;
  });
}
