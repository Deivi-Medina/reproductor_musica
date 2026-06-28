// assets/js/social/playlist-actions.js
import { state, loadInitialData } from "../var.js";
import { renderAlbumCards, renderPlaylistDetailView } from "../ui.js";
import { renderPlaylistsSidebarLinks } from "../playlist.js";
import { showAlert, showConfirm } from "../modals.js";
import { addPlaylistToLibraryAPI, mergePlaylistsAPI, checkFriendsAPI, checkMergedPlaylistAPI } from "../services/socialService.js";

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
    const data = await addPlaylistToLibraryAPI(playlistId);
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
    // Verificar si ya existe una playlist fusionada con este amigo
    const checkData = await checkMergedPlaylistAPI(friendId);
    if (checkData.success && checkData.exists) {
      await showAlert(
        `⚠️ Ya tienes una playlist fusionada con "${friendName}".<br><br>Puedes editarla desde tu biblioteca.`,
        "Playlist existente",
      );
      return false;
    }

    const confirm = await showConfirm(
      `¿Quieres fusionar tus playlists con las de "<strong>${friendName}</strong>"?<br><br>Se creará una playlist combinando las mejores canciones de ambos.`,
      "Fusionar Playlists",
      "Sí, fusionar",
      "Cancelar",
      false,
    );

    if (!confirm) return false;

    const data = await mergePlaylistsAPI(friendId);

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
    const data = await checkFriendsAPI(userId);
    return data.success && data.are_friends;
  } catch (error) {
    console.error("Error verificando amistad:", error);
    return false;
  }
}
