// assets/js/social/follow.js
export async function toggleFollowUser(userId, btnElement = null) {
  try {
    const response = await fetch(`${window.baseUrl}api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_follow_user",
        user_id: userId,
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      if (btnElement) {
        updateFollowButton(btnElement, data.following);
      }
      document.dispatchEvent(
        new CustomEvent("follow-updated", {
          detail: { userId, following: data.following },
        }),
      );
      return data.following;
    } else {
      console.error("Error al seguir usuario:", data.message);
      return false;
    }
  } catch (error) {
    console.error("Error de red al seguir usuario:", error);
    return false;
  }
}

export function updateFollowButton(btn, isFollowing) {
  if (isFollowing) {
    btn.textContent = "Dejar de seguir";
    btn.classList.add("following");
    const icon = btn.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", "user-minus");
  } else {
    btn.textContent = "Seguir";
    btn.classList.remove("following");
    const icon = btn.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", "user-plus");
  }
  if (window.lucide) window.lucide.createIcons();
}

export async function getFollowers(userId) {
  try {
    const response = await fetch(`${window.baseUrl}api.php?action=get_followers&user_id=${userId}`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.success ? data.followers : [];
  } catch (error) {
    console.error("Error al obtener seguidores:", error);
    return [];
  }
}

export async function getFollowing(userId) {
  try {
    const response = await fetch(`${window.baseUrl}api.php?action=get_following&user_id=${userId}`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.success ? data.following : [];
  } catch (error) {
    console.error("Error al obtener seguidos:", error);
    return [];
  }
}

export async function isFollowing(currentUserId, targetUserId) {
  try {
    const response = await fetch(`${window.baseUrl}api.php?action=is_following&user_id=${targetUserId}`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.success && data.is_following;
  } catch (error) {
    console.error("Error al verificar seguimiento:", error);
    return false;
  }
}
