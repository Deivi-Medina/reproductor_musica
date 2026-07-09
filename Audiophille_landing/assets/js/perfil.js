// // Función para cargar perfil y estadísticas
// async function loadProfileData() {
//   try {
//     const [profileRes, statsRes] = await Promise.all([
//       fetch(`${window.baseUrl}api.php?action=get_user_profile`),
//       fetch(`${window.baseUrl}api.php?action=get_user_stats`),
//     ]);
//     const profile = await profileRes.json();
//     const stats = await statsRes.json();

//     if (profile.success) {
//       document.getElementById("profileName").innerText = profile.user.nombre_usuario;
//       document.getElementById("profileEmail").innerText = profile.user.email;
//       const avatar = document.getElementById("profileAvatar");
//       if (profile.user.avatar) {
//         avatar.src = window.baseUrl + profile.user.avatar;
//       } else {
//         avatar.src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(profile.user.nombre_usuario)}`;
//       }
//       // Rellenar formulario de edición
//       document.getElementById("editUsername").value = profile.user.nombre_usuario;
//       document.getElementById("editEmail").value = profile.user.email;
//     }
//     if (stats.success) {
//       document.getElementById("statReviews").innerText = stats.total_reviews;
//       document.getElementById("statFavorites").innerText = stats.total_favorites;
//       document.getElementById("statPlaylists").innerText = stats.total_playlists;
//       document.getElementById("statImported").innerText = stats.total_imported;
//       document.getElementById("statAvgRating").innerText = stats.avg_rating + " ★";
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }

// // Configurar eventos de edición
// document.getElementById("editProfileBtn")?.addEventListener("click", () => {
//   document.getElementById("editProfileForm").style.display = "block";
//   document.getElementById("editProfileBtn").style.display = "none";
// });
// document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
//   document.getElementById("editProfileForm").style.display = "none";
//   document.getElementById("editProfileBtn").style.display = "inline-block";
// });
// document.getElementById("saveProfileBtn")?.addEventListener("click", async () => {
//   const formData = new FormData();
//   formData.append("action", "update_user_profile");
//   formData.append("username", document.getElementById("editUsername").value);
//   formData.append("email", document.getElementById("editEmail").value);
//   const password = document.getElementById("editPassword").value;
//   if (password) formData.append("password", password);
//   const avatarFile = document.getElementById("editAvatar").files[0];
//   if (avatarFile) formData.append("avatar", avatarFile);

//   const res = await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
//   const data = await res.json();
//   if (data.success) {
//     alert("Perfil actualizado correctamente");
//     document.getElementById("editProfileForm").style.display = "none";
//     document.getElementById("editProfileBtn").style.display = "inline-block";
//     loadProfileData(); // Recargar datos
//   } else {
//     alert("Error: " + data.message);
//   }
// });
