// assets/js/social/playlist-actions.js
import { state, loadInitialData } from "../var.js";
import { renderAlbumCards, renderPlaylistDetailView } from "../ui.js";
import { renderPlaylistsSidebarLinks } from "../playlist.js";
import { showAlert, showConfirm } from "../modals.js";

// Función central para refrescar toda la UI después de cambios en playlists
async function refreshAllUI() {
  try {
    await loadInitialData();
    renderPlaylistsSidebarLinks();
    renderAlbumCards();
    if (state.activePlaylistName) {
      renderPlaylistDetailView(state.activePlaylistName);
    }
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.warn("Error al refrescar UI:", e);
  }
}

export async function addPlaylistToLibrary(playlistId, playlistName) {
  try {
    const response = await fetch(`${window.baseUrl}api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_playlist_to_library",
        playlist_id: playlistId,
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      await showAlert(
        `<strong>✅ Playlist añadida!</strong><br><br>La playlist "<strong>${data.nombre}</strong>" se ha añadido a tu biblioteca.`,
        "Éxito",
      );
      await refreshAllUI();
      return true;
    } else {
      await showAlert(`❌ ${data.message}`, "Error");
      return false;
    }
  } catch (error) {
    console.error("Error al añadir playlist:", error);
    await showAlert("❌ Error de conexión al añadir la playlist", "Error");
    return false;
  }
}

export async function mergePlaylistsWithFriend(friendId, friendName) {
  try {
    const confirm = await showConfirm(
      `¿Quieres fusionar tus playlists con las de "<strong>${friendName}</strong>"?<br><br>Se creará una playlist combinando las mejores canciones de ambos.`,
      "Fusionar Playlists",
      "Sí, fusionar",
      "Cancelar",
      false,
    );

    if (!confirm) return false;

    const response = await fetch(`${window.baseUrl}api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "merge_playlists",
        friend_id: friendId,
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      let mensaje = `<strong>✅ Playlist fusionada creada exitosamente!</strong><br><br>`;
      mensaje += `"<strong>${data.nombre}</strong>"<br>`;
      mensaje += `Contiene <strong>${data.total_canciones}</strong> canciones.<br>`;
      if (data.copied_from_friend) {
        mensaje += `📌 Esta playlist ya existía en la biblioteca de ${friendName}, se ha copiado a tu biblioteca.`;
      } else {
        mensaje += `Guardada en la biblioteca de ambos usuarios.`;
      }
      await showAlert(mensaje, "¡Fusión exitosa!");
      await refreshAllUI();
      return true;
    } else {
      await showAlert(`❌ ${data.message}`, "Error");
      return false;
    }
  } catch (error) {
    console.error("Error al fusionar playlists:", error);
    await showAlert("❌ Error de conexión al fusionar playlists", "Error");
    return false;
  }
}

export async function checkAreFriends(userId) {
  try {
    const response = await fetch(`${window.baseUrl}api.php?action=check_friends&user_id=${userId}`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.success && data.are_friends;
  } catch (error) {
    console.error("Error verificando amistad:", error);
    return false;
  }
}
