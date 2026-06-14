// js/ia.js
import albums from "./canciones.js";
import { state, saveState } from "./var.js";

// Estados para flujos interactivos
if (!window.curAlbumCreation) {
  window.curAlbumCreation = {
    active: false,
    titulo: "",
    artista: "",
    cover: "",
    songs: [],
    coverAttempts: 0,
    waitingForDetails: false,
  };
}
if (!window.curPlaylistCreation) {
  window.curPlaylistCreation = {
    active: false,
    step: 0,
    nombre: "",
  };
}

export async function procesarComandoIA(instruccionUsuario, archivoAdjunto = null, callbackActualizarInterfaz) {
  const prompt = instruccionUsuario.toLowerCase().trim();

  // Procesar archivo adjunto primero
  if (archivoAdjunto) {
    return procesarArchivo(archivoAdjunto, prompt, callbackActualizarInterfaz);
  }

  // Cancelar flujo activo
  if (prompt === "cancelar" || prompt === "salir" || prompt === "cancel") {
    if (window.curPlaylistCreation.active) {
      window.curPlaylistCreation.active = false;
      window.curPlaylistCreation.step = 0;
      return `❌ Creación de playlist cancelada. Puedes pedirme una nueva cuando quieras.`;
    }
    if (window.curAlbumCreation.active) {
      window.curAlbumCreation.active = false;
      window.curAlbumCreation.coverAttempts = 0;
      return `❌ Creación de álbum cancelada. Tu biblioteca no ha sufrido cambios.`;
    }
    return `👍 Entendido. Si necesitas algo, solo dímelo.`;
  }

  // Ayuda explícita
  if (prompt === "ayuda" || prompt === "comandos" || prompt === "help") {
    return mostrarAyuda();
  }

  // Saludos simples
  if (prompt.match(/^(hola|buenas|qué tal|hey|oye|saludos|ola)$/i)) {
    return `👋 ¡Hola! Estoy aquí para ayudarte con tu música. ¿Necesitas crear una playlist, un álbum, o ver estadísticas? Escribe *"ayuda"* si quieres ver todos los comandos.`;
  }

  // ⚠️ PRIORIDAD: CREAR ÁLBUM (antes que artista favorito)
  if (prompt.includes("crear") || prompt.includes("crea") || prompt.includes("nuevo album") || prompt.includes("nuevo álbum")) {
    return iniciarCreacionAlbum(instruccionUsuario);
  }

  // Estadísticas
  if (prompt.includes("estadística") || prompt.includes("estadisticas") || prompt === "stats") {
    return generarEstadisticas();
  }

  // Recomendaciones
  if (prompt.includes("recomienda") || prompt.includes("sugiere") || prompt.includes("recomendación")) {
    return recomendarCanciones();
  }

  // Flujo de playlist activo
  if (window.curPlaylistCreation.active) {
    return manejarFlujoPlaylist(instruccionUsuario, prompt, callbackActualizarInterfaz);
  }

  // Detectar creación de playlist (flujo interactivo)
  if (
    (prompt.includes("playlist") || prompt.includes("lista")) &&
    (prompt.includes("crea") || prompt.includes("nueva") || prompt.includes("haz") || prompt.includes("genera"))
  ) {
    window.curPlaylistCreation.active = true;
    window.curPlaylistCreation.step = 1;
    return `🎵 **Vamos a crear una nueva playlist**  
            \nPrimero, **¿cómo quieres llamarla?**  
            \n*(Ejemplo: "Rock para entrenar" o "Mis favoritas")* ✨`;
  }

  // Artista favorito (después de álbum)
  if (prompt.includes("artista favorito") || prompt.includes("más escuchado") || prompt.includes("top artista")) {
    return obtenerArtistaFavorito();
  }

  // Flujo de álbum activo
  if (window.curAlbumCreation.active) {
    return manejarFlujoAlbum(instruccionUsuario, prompt, callbackActualizarInterfaz);
  }

  // Comandos directos de playlist (eliminar, agregar, crear simple)
  return procesarMensajeLocal(instruccionUsuario, callbackActualizarInterfaz);
}

// ================== FUNCIONES AUXILIARES ==================

function mostrarAyuda() {
  return `
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <b>🎵 Comandos disponibles:</b>
      <span>• <i>"Crea una playlist"</i> → te guío paso a paso.</span>
      <span>• <i>"Crea el álbum [título] de [artista]"</i> → ejemplo: <i>"Crea el álbum Thriller de Michael Jackson"</i></span>
      <span>• <i>"¿Cuál es mi artista favorito?"</i> → analizo reproducciones y reseñas.</span>
      <span>• <i>"Recomiéndame canciones"</i> → basado en tu historial.</span>
      <span>• <i>"Estadísticas"</i> → resumen de tu biblioteca.</span>
      <span>• <i>"Agrega [canción] a [playlist]"</i> → añade una canción existente.</span>
      <span>• <i>"Elimina la playlist [nombre]"</i> → borra una playlist.</span>
      <span>• <i>"Cancelar"</i> → detiene cualquier proceso en curso.</span>
      <span>📎 También puedes <b>adjuntar imágenes o audios</b> directamente con tu mensaje.</span>
    </div>
  `;
}

function generarEstadisticas() {
  const totalAlbums = albums.length;
  let totalSongs = 0;
  albums.forEach((album) => (totalSongs += album.songs.length));
  const totalPlaylists = Object.keys(state.playlists).length;
  const totalFavorites = state.favorites.length;
  const totalReviews = JSON.parse(localStorage.getItem("mg_song_reviews") || "[]").length;
  return `
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <b>📊 Estadísticas de tu biblioteca</b>
      • Álbumes: ${totalAlbums}
      • Canciones: ${totalSongs}
      • Playlists: ${totalPlaylists}
      • Canciones favoritas: ${totalFavorites}
      • Reseñas escritas: ${totalReviews}
    </div>
  `;
}

function recomendarCanciones() {
  const plays = JSON.parse(localStorage.getItem("mg_artist_plays")) || {};
  if (Object.keys(plays).length === 0) {
    const allSongs = [];
    albums.forEach((album) => {
      album.songs.forEach((song) => {
        allSongs.push(`${song.trackTitle} - ${album.artist}`);
      });
    });
    const randomSongs = allSongs.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `🎧 Como aún no tengo suficientes datos, te recomiendo estas canciones populares:<br>• ${randomSongs.join("<br>• ")}`;
  }
  let topArtist = "";
  let maxPlays = 0;
  for (const [artist, count] of Object.entries(plays)) {
    if (count > maxPlays) {
      maxPlays = count;
      topArtist = artist;
    }
  }
  const recomendadas = [];
  albums.forEach((album) => {
    if (album.artist.toLowerCase().includes(topArtist.toLowerCase())) {
      album.songs.forEach((song) => {
        recomendadas.push(`${song.trackTitle} - ${album.artist}`);
      });
    }
  });
  if (recomendadas.length === 0) {
    return `🎧 Basado en tu artista favorito (${topArtist}), no encontré más canciones de él/ella. ¡Prueba a importar más música!`;
  }
  const unique = [...new Set(recomendadas)];
  const picks = unique.slice(0, 3);
  return `🎧 Basado en tu artista más escuchado (${topArtist}), te recomiendo:<br>• ${picks.join("<br>• ")}`;
}

function obtenerArtistaFavorito() {
  if (!window.obtenerArtistaMasEscuchadoYValorado) {
    return "🔧 El sistema de análisis aún no está listo. Reproduce algunas canciones y califícalas.";
  }
  const res = window.obtenerArtistaMasEscuchadoYValorado();
  if (res.artista === "Ninguno todavía") {
    return `🎧 Aún no tengo suficientes datos. Empieza a **reproducir música** y **califica canciones** en el Diario.`;
  }
  return `⭐ Tu artista con mayor fidelidad es **${res.artista}**  
          • Puntuación total: ${res.puntuacion} pts  
          • Reproducciones: ${res.reproducciones}  
          • Calificación media: ${res.ratingPromedio} ★`;
}

function procesarArchivo(file, textoPrompt, callbackActualizarInterfaz) {
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");

  if (window.curAlbumCreation.active && !window.curAlbumCreation.cover && isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      window.curAlbumCreation.cover = e.target.result;
      window.curAlbumCreation.coverAttempts = 0;
    };
    reader.readAsDataURL(file);
    return `🖼️ Portada recibida. Ahora **sube las canciones** (una por una) o escribe *"listo"* para publicar el álbum.`;
  }

  if (window.curAlbumCreation.active && window.curAlbumCreation.cover && isAudio) {
    const fileURL = URL.createObjectURL(file);
    const cleanedTitle = file.name.replace(/\.[^/.]+$/, "");
    window.curAlbumCreation.songs.push({ trackTitle: cleanedTitle, file: fileURL });
    const count = window.curAlbumCreation.songs.length;
    return `🎵 Canción "${cleanedTitle}" agregada. Llevas **${count} canción(es)**. Sigue subiendo o escribe *"listo"*.`;
  }

  if (isAudio && !window.curAlbumCreation.active) {
    const fileURL = URL.createObjectURL(file);
    const cleanedTitle = file.name.replace(/\.[^/.]+$/, "");
    const newSong = {
      trackTitle: cleanedTitle,
      file: fileURL,
      artistName: "Importación Local",
      albumCover: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
    };
    state.importedSongs.push(newSong);
    saveState();
    let idx = albums.findIndex((a) => a.title === "Mis Archivos Importados");
    if (idx > -1) albums[idx].songs = state.importedSongs;
    else
      albums.push({
        title: "Mis Archivos Importados",
        artist: "Usuario Local",
        cover: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
        songs: state.importedSongs,
      });
    if (callbackActualizarInterfaz) callbackActualizarInterfaz();
    return `✨ Canción "${cleanedTitle}" importada correctamente. Puedes pedirme que cree un álbum con ella si quieres.`;
  }

  return `📎 Recibí el archivo "${file.name}", pero no sé qué hacer con él. Si estás creando un álbum, primero escribe el nombre. Si es música, la he importado automáticamente.`;
}

// ================== FLUJOS INTERACTIVOS ==================

function manejarFlujoPlaylist(mensajeUsuario, prompt, callbackActualizarInterfaz) {
  if (window.curPlaylistCreation.step === 1) {
    let nombre = mensajeUsuario.trim().replace(/["'«»]/g, "");
    if (nombre.length < 2) return `⚠️ El nombre es muy corto. Dame al menos 2 letras.`;
    if (nombre.length > 50) return `⚠️ El nombre es demasiado largo (máximo 50 caracteres). Acórtalo.`;
    window.curPlaylistCreation.nombre = nombre;
    window.curPlaylistCreation.step = 2;
    return `✍️ Perfecto. La playlist se llamará \`${nombre}\`.  
            \nAhora, dime cómo llenarla:  
            • Escribe un **artista o género** (ej. *The Beatles*, *Rock*)  
            • O escribe **"vacía"** para crearla sin canciones.`;
  }

  if (window.curPlaylistCreation.step === 2) {
    const criterio = prompt;
    const nombrePlaylist = window.curPlaylistCreation.nombre;

    if (!state.playlists) state.playlists = {};
    state.playlists[nombrePlaylist] = {
      portada: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500",
      canciones: [],
    };

    let cancionesAgregadas = 0;
    if (criterio !== "vacía" && criterio !== "vacia") {
      albums.forEach((album) => {
        album.songs.forEach((song) => {
          const coincideArtista = album.artist.toLowerCase().includes(criterio);
          const coincideGeneroAlbum = album.genre && album.genre.toLowerCase().includes(criterio);
          const coincideGeneroSong = song.genre && song.genre.toLowerCase().includes(criterio);
          if (coincideArtista || coincideGeneroAlbum || coincideGeneroSong) {
            state.playlists[nombrePlaylist].canciones.push({
              trackTitle: song.trackTitle,
              file: song.file,
              artistName: album.artist,
              albumCover: album.cover,
              originalAlbumIdx: albums.indexOf(album),
            });
            cancionesAgregadas++;
          }
        });
      });
    }

    saveState();
    if (callbackActualizarInterfaz) callbackActualizarInterfaz();
    else if (window.renderPlaylistsSidebarLinks) {
      window.renderPlaylistsSidebarLinks();
      if (window.renderAlbumCards) window.renderAlbumCards();
    }

    window.curPlaylistCreation.active = false;
    window.curPlaylistCreation.step = 0;

    if (cancionesAgregadas > 0) {
      return `🎉 **Playlist creada con éxito**  
              \n📀 "${nombrePlaylist}"  
              ✅ Se añadieron **${cancionesAgregadas} canciones** (coinciden con "${criterio}").`;
    } else {
      return `✨ Playlist "${nombrePlaylist}" creada (vacía).  
              \nPuedes llenarla manualmente: haz clic en ⋮ de cualquier canción y selecciona esta playlist.`;
    }
  }
  return `⚠️ Hubo un error. Escribe *"cancelar"* y vuelve a intentarlo.`;
}

function iniciarCreacionAlbum(mensajeUsuario) {
  let titulo = "",
    artista = "";

  // Regex más robusta para detectar "crea el álbum X de Y"
  const match = mensajeUsuario.match(
    /(?:crea|crear|nuevo)\s+(?:el\s+)?(?:álbum|album|disco)\s+(?:llamado\s+)?["'«]?([^"'\n\r«]+?)["'»]?\s+(?:de|por)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
  );

  if (match) {
    titulo = match[1].trim();
    artista = match[2].trim();
  } else {
    // Si no sigue el patrón, preguntamos al usuario
    window.curAlbumCreation = {
      active: true,
      titulo: "",
      artista: "",
      cover: "",
      songs: [],
      coverAttempts: 0,
      waitingForDetails: true,
    };
    return `📝 Para crear un álbum, necesito el título y el artista.  
            \nEscribe: **"crea el álbum [título] de [artista]"**  
            \nEjemplo: *"crea el álbum Thriller de Michael Jackson"*  
            \n¿Puedes decírmelo así?`;
  }

  window.curAlbumCreation = {
    active: true,
    titulo: titulo,
    artista: artista,
    cover: "",
    songs: [],
    coverAttempts: 0,
    waitingForDetails: false,
  };

  return `✨ **Vamos a crear tu álbum**  
          \n🎬 Título: **${titulo}**  
          👤 Artista: **${artista}**  
          \n**Paso 1:** Sube una imagen de portada usando el clip 📎 (o escribe *"omitir"* para usar una genérica).  
          \nLuego podrás añadir canciones una por una. Cuando termines, escribe *"listo"*.`;
}

function manejarFlujoAlbum(mensajeUsuario, prompt, callbackActualizarInterfaz) {
  const cur = window.curAlbumCreation;

  // Si estamos esperando que el usuario dé el formato correcto
  if (cur.waitingForDetails) {
    const match = mensajeUsuario.match(
      /(?:crea|crear)\s+(?:el\s+)?(?:álbum|album)?\s+["'«]?([^"'\n\r«]+?)["'»]?\s+(?:de|por)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
    );
    if (match) {
      cur.titulo = match[1].trim();
      cur.artista = match[2].trim();
      cur.waitingForDetails = false;
      return `✅ Perfecto. Ahora tenemos:  
              \n🎬 **${cur.titulo}** de **${cur.artista}**  
              \n**Paso 1:** Sube una imagen de portada (clip 📎) o escribe *"omitir"*.`;
    } else {
      return `❓ No entendí el formato. Escribe algo como:  
              \n*"crea el álbum Thriller de Michael Jackson"*  
              \nO escribe *"cancelar"* para salir.`;
    }
  }

  if (!cur.cover) {
    if (prompt === "omitir" || prompt === "defecto") {
      cur.cover = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
      cur.coverAttempts = 0;
      return `🖼️ Usaremos una portada genérica.  
              \n**Paso 2:** Ahora sube tus canciones (.mp3, .wav) con el clip 📎.  
              \nCuando termines, escribe *"listo"*.`;
    }
    cur.coverAttempts++;
    if (cur.coverAttempts >= 3) {
      return `❓ Llevas ${cur.coverAttempts} intentos sin subir una imagen. ¿Quieres usar una portada genérica? Escribe *"omitir"* o sigue subiendo una imagen.`;
    }
    return `🖼️ **Esperando la portada para "${cur.titulo}"**  
            \nSube una imagen (jpg, png) con el botón 📎, o escribe *"omitir"*.`;
  }

  if (prompt === "listo" || prompt === "guardar" || prompt === "terminar") {
    if (cur.songs.length === 0) {
      return `⚠️ El álbum "${cur.titulo}" no tiene canciones. Sube al menos un audio o escribe *"cancelar"*.`;
    }
    const nuevoAlbum = {
      title: cur.titulo,
      artist: cur.artista,
      cover: cur.cover,
      songs: [...cur.songs],
    };
    albums.push(nuevoAlbum);
    const custom = JSON.parse(localStorage.getItem("mg_custom_albums_vanilla") || "[]");
    custom.push(nuevoAlbum);
    localStorage.setItem("mg_custom_albums_vanilla", JSON.stringify(custom));
    window.curAlbumCreation.active = false;
    if (callbackActualizarInterfaz) callbackActualizarInterfaz();
    return `🎉 **¡Álbum publicado con éxito!**  
            \n**${nuevoAlbum.title}** de **${nuevoAlbum.artist}**  
            \nContiene **${nuevoAlbum.songs.length} canciones**.  
            \nYa puedes verlo en tu biblioteca. ¡Excelente trabajo! 🎧`;
  }

  return `💿 **Editando álbum: "${cur.titulo}"**  
          \n• Canciones añadidas: ${cur.songs.length}  
          • Sube más audios con el clip 📎  
          • Cuando termines, escribe *"listo"*  
          • Para cancelar: *"cancelar"*.`;
}

function procesarMensajeLocal(mensajeUsuario, callbackActualizarInterfaz) {
  const prompt = mensajeUsuario.toLowerCase().trim();

  // Eliminar playlist
  if (prompt.includes("elimina") || prompt.includes("borra")) {
    const matchDelete = mensajeUsuario.match(/(?:elimina|borra)(?:r)?\s+(?:la\s+)?playlist\s+["'«]?([^"'\n\r«]+?)["'»]?$/i);
    if (matchDelete) {
      const pName = matchDelete[1].trim();
      if (state.playlists && state.playlists[pName]) {
        delete state.playlists[pName];
        saveState();
        if (callbackActualizarInterfaz) callbackActualizarInterfaz();
        return `🗑️ He eliminado la playlist **"${pName}"**.`;
      } else {
        return `⚠️ No encontré ninguna playlist llamada **"${pName}"**.`;
      }
    }
  }

  // Agregar canción a playlist
  if (prompt.includes("agrega") || prompt.includes("añade") || prompt.includes("mete")) {
    const matchAdd = mensajeUsuario.match(
      /(?:agrega|añade|mete)(?:r)?\s+["'«]?([^"']+)["'»]?\s+(?:a\s+la\s+playlist|a|en)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
    );
    if (matchAdd) {
      const songNameInput = matchAdd[1].trim().toLowerCase();
      const playlistNameInput = matchAdd[2].trim();
      let matchedPlaylistName = null;
      if (state.playlists) {
        for (const name of Object.keys(state.playlists)) {
          if (name.toLowerCase() === playlistNameInput.toLowerCase()) {
            matchedPlaylistName = name;
            break;
          }
        }
      }
      if (!matchedPlaylistName) return `⚠️ No encuentro la playlist "${playlistNameInput}". Créala primero con "crea una playlist".`;

      let foundSongObj = null;
      albums.forEach((album, albumIdx) => {
        album.songs.forEach((song) => {
          if (song.trackTitle.toLowerCase() === songNameInput) {
            foundSongObj = {
              trackTitle: song.trackTitle,
              file: song.file,
              artistName: song.artistName || album.artist,
              albumCover: song.albumCover || album.cover,
              originalAlbumIdx: albumIdx,
            };
          }
        });
      });
      if (!foundSongObj) return `⚠️ No encontré una canción llamada "${matchAdd[1]}" en tu biblioteca.`;

      const playlist = state.playlists[matchedPlaylistName];
      if (playlist.canciones.some((s) => s.file === foundSongObj.file)) {
        return `⚠️ La canción "${foundSongObj.trackTitle}" ya está en la playlist "${matchedPlaylistName}". No se añadió duplicado.`;
      }
      playlist.canciones.push(foundSongObj);
      saveState();
      if (callbackActualizarInterfaz) callbackActualizarInterfaz();
      return `🎵 ¡Éxito! Agregué "${foundSongObj.trackTitle}" a la playlist "${matchedPlaylistName}".`;
    }
  }

  // Crear playlist simple (un solo mensaje)
  if (prompt.includes("playlist") && (prompt.includes("crea") || prompt.includes("crear") || prompt.includes("nueva"))) {
    const matchCreate = mensajeUsuario.match(/(?:crea|crear|nueva)\s+playlist\s+(?:llamada\s+)?["'«]?([^"'\n\r«]+?)["'»]?$/i);
    if (matchCreate) {
      const pName = matchCreate[1].trim();
      if (state.playlists && state.playlists[pName]) return `⚠️ La playlist "${pName}" ya existe.`;
      if (!state.playlists) state.playlists = {};
      state.playlists[pName] = { canciones: [], portada: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400" };
      saveState();
      if (callbackActualizarInterfaz) callbackActualizarInterfaz();
      return `🎉 Playlist "${pName}" creada con éxito. Puedes agregar canciones con "agrega [canción] a ${pName}".`;
    }
  }

  // Respuesta por defecto (corta y amable)
  return `🎵 No entendí ese comando. Escribe *"ayuda"* para ver lo que puedo hacer por ti.`;
}
