import albums from './canciones.js';
import DOM from './var.js'; // Importación por defecto del objeto unificado y congelado

// --- 1. ESTADO INTERNO DE LA APP ---
let currentAudio = null;
let currentAlbumIndex = null;
let isPlaying = false;

let isShuffleActive = false;
let isRepeatActive = false; 

let playlistActual = [];      
let colaReproduccion = [];    
let indiceColaActual = 0;     

// Estado persistente: Inicializar Favoritos y Playlists desde localStorage
let favoritos = JSON.parse(localStorage.getItem('mg_favoritos')) || [];
let playlistsCreadas = JSON.parse(localStorage.getItem('mg_playlists')) || {};

// Almacenamos temporalmente qué canción abrió el menú contextual { albumIdx, songIdx }
let activeContextTrack = null;

// --- 2. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarPlaylistsVisuales();
    configurarEventosFijos();
});

// --- 3. FUNCIONES DE PERSISTENCIA Y PLAYLISTS ---
function guardarFavoritosEnStorage() {
    localStorage.setItem('mg_favoritos', JSON.stringify(favoritos));
    inicializarPlaylistsVisuales();
}

function guardarPlaylistsEnStorage() {
    localStorage.setItem('mg_playlists', JSON.stringify(playlistsCreadas));
    inicializarPlaylistsVisuales();
}

function actualizarResaltadoSidebar(elementoActivo) {
    // Quita la clase 'active' de los botones fijos
    DOM.sidebar.navHome.classList.remove('active');
    DOM.sidebar.navFavorites.classList.remove('active');
    
    // Quita la clase 'active' de cualquier otra playlist dinámica
    const links = DOM.sidebar.playlistsContainer.querySelectorAll('.playlist-link');
    links.forEach(link => link.classList.remove('active'));
    
    // Añade la clase 'active' únicamente al elemento al que se le hizo clic
    if (elementoActivo) {
        elementoActivo.classList.add('active');
    }
}

function inicializarPlaylistsVisuales() {
    // Render de la barra lateral izquierda
    DOM.sidebar.playlistsContainer.innerHTML = '';
    
    // Si hay favoritos, renderizar la playlist inteligente si no se usa el botón fijo
    if (favoritos.length > 0) {
        DOM.sidebar.navFavorites.classList.remove('hidden');
    }

    // Listar playlists personalizadas
    Object.keys(playlistsCreadas).forEach(nombre => {
        const btn = document.createElement('button');
        btn.className = 'playlist-link sidebar-navigation-item'; 
        btn.innerHTML = `<i data-lucide="music-4"></i> <span>${nombre}</span>`;
        
        btn.onclick = (e) => {
            actualizarResaltadoSidebar(btn);
            cargarVistaPlaylistPersonalizada(nombre);
        };
        DOM.sidebar.playlistsContainer.appendChild(btn);
    });
    lucide.createIcons();
}

// --- 4. CONTROLADORES CONTEXTUALES (POP-OVER DESPLEGABLE) ---
window.abrirMenuContextual = function(event, albumIdx, songIdx) {
    event.stopPropagation();
    activeContextTrack = { albumIdx, songIdx };
    
    // Posicionar el menú pop-over cerca del puntero o botón
    DOM.contextMenu.container.style.top = `${event.clientY + window.scrollY}px`;
    DOM.contextMenu.container.style.left = `${event.clientX - 200 + window.scrollX}px`;
    DOM.contextMenu.container.classList.remove('hidden');

    // Listar las playlists disponibles dentro del menú contextual
    DOM.contextMenu.playlistsList.innerHTML = '';
    const listaNombres = Object.keys(playlistsCreadas);
    
    if (listaNombres.length === 0) {
        DOM.contextMenu.playlistsList.innerHTML = '<div class="context-submenu-title" style="text-transform:none; opacity:0.5;">No hay playlists creadas</div>';
    } else {
        listaNombres.forEach(nombre => {
            const btn = document.createElement('button');
            btn.className = 'context-option';
            btn.style.fontSize = '13px';
            btn.style.padding = '6px 12px';
            btn.textContent = nombre;
            btn.onclick = () => {
                añadirCancionAPlaylist(nombre, activeContextTrack.albumIdx, activeContextTrack.songIdx);
                DOM.contextMenu.container.classList.add('hidden');
            };
            DOM.contextMenu.playlistsList.appendChild(btn);
        });
    }
};

function añadirCancionAPlaylist(nombrePlaylist, albumIdx, songIdx) {
    const song = albums[albumIdx].songs[songIdx];
    // CORREGIDO: Acceso seguro al nuevo esquema estructurado de datos (.canciones)
    const yaExiste = playlistsCreadas[nombrePlaylist].canciones.some(s => s.file === song.file);
    if (!yaExiste) {
        playlistsCreadas[nombrePlaylist].canciones.push({
            ...song,
            artistName: albums[albumIdx].artist,
            albumCover: albums[albumIdx].cover,
            originalAlbumIdx: albumIdx
        });
        guardarPlaylistsEnStorage();
    }
}

// Cierre del menú contextual al hacer clic fuera
document.addEventListener('click', () => {
    DOM.contextMenu.container.classList.add('hidden');
});

// --- 5. SOLUCIÓN AL ERROR DE CLICS Y CONTROL DE COLA ---
window.agregarCancionALaCola = function(albumIdx, songIdx) {
    const cancionAAgregar = { ...albums[albumIdx].songs[songIdx] };
    
    cancionAAgregar.artistName = albums[albumIdx].artist; 
    cancionAAgregar.albumCover = albums[albumIdx].cover;
    cancionAAgregar.originalAlbumIdx = albumIdx;
    
    colaReproduccion.push(cancionAAgregar);
    
    if (!currentAudio) {
        currentAlbumIndex = albumIdx;
        indiceColaActual = colaReproduccion.length - 1;
        cargarYEjecutarPista();
        DOM.miniPlayer.container.classList.remove('hidden');
    } else {
        renderizarColaVisual();
    }
};

// --- 6. VISTAS DE LA INTERFAZ (LÓGICA UX) ---
window.openAlbumView = function(albumIndex) {
    currentAlbumIndex = albumIndex;
    const album = albums[albumIndex];

    DOM.currentAlbumDetail.title.textContent = album.title;
    DOM.currentAlbumDetail.artist.textContent = album.artist;
    DOM.currentAlbumDetail.cover.src = album.cover;

    DOM.views.tracksList.innerHTML = '';

    album.songs.forEach((song, idx) => {
        const trackRow = document.createElement('div');
        trackRow.className = 'track-row';
        trackRow.id = `track-row-${idx}`;
        trackRow.onclick = () => iniciarReproduccionDesdeAlbum(idx);

        trackRow.innerHTML = `
            <span class="track-number">${idx + 1}</span>
            <span class="track-title">${song.trackTitle}</span>
            <span class="track-album-inside">${album.title}</span>
            <span class="track-duration">--:--</span>
            <button class="btn-track-actions" title="Opciones" onclick="window.abrirMenuContextual(event, ${albumIndex}, ${idx})">
                <i data-lucide="more-horizontal"></i>
            </button>
        `;
        
        DOM.views.tracksList.appendChild(trackRow);
        obtenerYAsignarDuracionMeta(song.file, trackRow.querySelector('.track-duration'));
    });

    DOM.views.library.classList.add('hidden');
    DOM.views.header.classList.add('hidden');
    DOM.views.albumDetail.classList.remove('hidden');
    actualizarFilaActivaResaltado();
    lucide.createIcons();
};

window.closeAlbumView = function() {
    DOM.views.albumDetail.classList.add('hidden');
    DOM.views.library.classList.remove('hidden');
    DOM.views.header.classList.remove('hidden');
};

window.expandFullPlayer = function() {
    DOM.fullPlayer.container.classList.remove('hidden');
};

window.minimizeFullPlayer = function() {
    DOM.fullPlayer.container.classList.add('hidden');
};

function cargarVistaFavoritos() {
    currentAlbumIndex = null;
    DOM.currentAlbumDetail.title.textContent = "Canciones que te gustan";
    DOM.currentAlbumDetail.artist.textContent = "Playlist Inteligente Automática";
    DOM.currentAlbumDetail.cover.src = favoritos[0]?.albumCover || "https://images.unsplash.com/photo-1513829092359-0f2c4114ecfa?q=80&w=400";

    DOM.views.tracksList.innerHTML = '';
    playlistActual = [...favoritos];
    colaReproduccion = [...favoritos];

    favoritos.forEach((song, idx) => {
        const trackRow = document.createElement('div');
        trackRow.className = 'track-row';
        trackRow.onclick = () => {
            indiceColaActual = idx;
            cargarYEjecutarPista();
            DOM.miniPlayer.container.classList.remove('hidden');
        };

        trackRow.innerHTML = `
            <span class="track-number">${idx + 1}</span>
            <span class="track-title">${song.trackTitle}</span>
            <span class="track-album-inside">${song.artistName}</span>
            <span class="track-duration">--:--</span>
            <button class="btn-track-actions" title="Eliminar de favoritos" onclick="event.stopPropagation(); eliminarDeFavoritos(${idx})">
                <i data-lucide="heart-off"></i>
            </button>
        `;
        DOM.views.tracksList.appendChild(trackRow);
        obtenerYAsignarDuracionMeta(song.file, trackRow.querySelector('.track-duration'));
    });

    DOM.views.library.classList.add('hidden');
    DOM.views.header.classList.add('hidden');
    DOM.views.albumDetail.classList.remove('hidden');
    lucide.createIcons();
}

window.eliminarDeFavoritos = function(index) {
    favoritos.splice(index, 1);
    guardarFavoritosEnStorage();
    cargarVistaFavoritos();
    evaluarEstadoCorazonFavorito();
};

function cargarVistaPlaylistPersonalizada(nombre) {
    currentAlbumIndex = null;
    
    // CORREGIDO: Mapeo seguro para extraer canciones y la carátula personalizada
    const datosPlaylist = playlistsCreadas[nombre];
    const listaCanciones = datosPlaylist.canciones || [];

    DOM.currentAlbumDetail.title.textContent = nombre;
    DOM.currentAlbumDetail.artist.textContent = "Playlist Personalizada";
    DOM.currentAlbumDetail.cover.src = datosPlaylist.portada || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";

    DOM.views.tracksList.innerHTML = '';
    playlistActual = [...listaCanciones];
    colaReproduccion = [...listaCanciones];

    listaCanciones.forEach((song, idx) => {
        const trackRow = document.createElement('div');
        trackRow.className = 'track-row';
        trackRow.onclick = () => {
            indiceColaActual = idx;
            cargarYEjecutarPista();
            DOM.miniPlayer.container.classList.remove('hidden');
        };

        trackRow.innerHTML = `
            <span class="track-number">${idx + 1}</span>
            <span class="track-title">${song.trackTitle}</span>
            <span class="track-album-inside">${song.artistName}</span>
            <span class="track-duration">--:--</span>
            <button class="btn-track-actions" title="Más opciones" onclick="window.abrirMenuContextual(event, ${song.originalAlbumIdx}, ${idx})">
                <i data-lucide="more-horizontal"></i>
            </button>
        `;
        DOM.views.tracksList.appendChild(trackRow);
        obtenerYAsignarDuracionMeta(song.file, trackRow.querySelector('.track-duration'));
    });

    DOM.views.library.classList.add('hidden');
    DOM.views.header.classList.add('hidden');
    DOM.views.albumDetail.classList.remove('hidden');
    lucide.createIcons();
}

// --- 7. RENDERIZAR COLA VISUAL (LATERAL DERECHO) ---
function renderizarColaVisual() {
    DOM.queue.dynamicList.innerHTML = '';

    if (colaReproduccion.length === 0) {
        DOM.queue.dynamicList.innerHTML = '<div class="queue-item">Cola vacía</div>';
        return;
    }

    colaReproduccion.forEach((song, idx) => {
        const queueItem = document.createElement('div');
        queueItem.className = `queue-item ${idx === indiceColaActual ? 'queue-active' : ''}`;
        
        queueItem.onclick = () => {
            indiceColaActual = idx;
            if (song.originalAlbumIdx !== undefined) {
                currentAlbumIndex = song.originalAlbumIdx;
            }
            cargarYEjecutarPista();
        };

        queueItem.innerHTML = `
            <span class="queue-title">${song.trackTitle}</span>
            <span class="queue-artist">${song.artistName || albums[currentAlbumIndex].artist}</span>
        `;
        DOM.queue.dynamicList.appendChild(queueItem);
    });
}

// --- 8. CONTROLADORES CENTRALES DE AUDIO ---
function iniciarReproduccionDesdeAlbum(indiceCancionPresionada) {
    const album = albums[currentAlbumIndex];
    
    playlistActual = album.songs.map(s => ({...s, artistName: album.artist, albumCover: album.cover, originalAlbumIdx: currentAlbumIndex}));
    colaReproduccion = album.songs.map(s => ({...s, artistName: album.artist, albumCover: album.cover, originalAlbumIdx: currentAlbumIndex}));

    indiceColaActual = indiceCancionPresionada;

    cargarYEjecutarPista();
    DOM.miniPlayer.container.classList.remove('hidden');
}

function cargarYEjecutarPista() {
    if (colaReproduccion.length === 0) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeEventListener('timeupdate', manejarTiempoAudio);
        currentAudio.removeEventListener('ended', manejarFinPista);
    }

    const pistaActual = colaReproduccion[indiceColaActual];
    
    DOM.fullPlayer.title.textContent = pistaActual.trackTitle;
    DOM.miniPlayer.title.textContent = pistaActual.trackTitle;
    
    const caratulaAUsar = pistaActual.albumCover || albums[currentAlbumIndex]?.cover;
    DOM.fullPlayer.cover.src = caratulaAUsar;
    DOM.miniPlayer.cover.src = caratulaAUsar;
    
    const artistaAUsar = pistaActual.artistName || albums[currentAlbumIndex]?.artist;
    DOM.fullPlayer.artist.textContent = artistaAUsar;
    DOM.miniPlayer.artist.textContent = artistaAUsar;

    currentAudio = new Audio(pistaActual.file);
    currentAudio.volume = DOM.audioControls.volSlider.value / 100;

    currentAudio.addEventListener('timeupdate', manejarTiempoAudio);
    currentAudio.addEventListener('ended', manejarFinPista);

    currentAudio.play()
        .then(() => {
            isPlaying = true;
            actualizarIconosPlayPause();
            evaluarEstadoCorazonFavorito();
            actualizarFilaActivaResaltado();
            renderizarColaVisual(); 
        })
        .catch(err => console.error("Error al reproducir audio:", err));
}

function conmutarPlay() {
    if (!currentAudio) return;
    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
    } else {
        currentAudio.play();
        isPlaying = true;
    }
    actualizarIconosPlayPause();
}

function saltarSiguiente() {
    if (colaReproduccion.length === 0) return;

    if (isShuffleActive && colaReproduccion.length > 1) {
        let nuevoIndice;
        do {
            nuevoIndice = Math.floor(Math.random() * colaReproduccion.length);
        } while (nuevoIndice === indiceColaActual);
        
        indiceColaActual = nuevoIndice;
    } else {
        indiceColaActual = (indiceColaActual + 1) % colaReproduccion.length;
    }
    
    cargarYEjecutarPista();
}

function saltarAnterior() {
    if (colaReproduccion.length === 0) return;
    indiceColaActual = (indiceColaActual - 1 + colaReproduccion.length) % colaReproduccion.length;
    cargarYEjecutarPista();
}

function conmutarAleatorio() {
    isShuffleActive = !isShuffleActive;
    DOM.audioControls.btnShuffle.classList.toggle('active-control', isShuffleActive);

    if (colaReproduccion.length <= 1) return; 
    
    const pistaSonando = colaReproduccion[indiceColaActual];

    if (isShuffleActive) {
        let cancionesParaMezclar = colaReproduccion.filter(song => song.file !== pistaSonando.file);
        desordenarArrayMatematico(cancionesParaMezclar);
        
        colaReproduccion = [pistaSonando, ...cancionesParaMezclar];
        indiceColaActual = 0;
    } else {
        colaReproduccion = [...playlistActual];
        indiceColaActual = colaReproduccion.findIndex(song => song.file === pistaSonando.file);
    }
    renderizarColaVisual();
}

function conmutarBucle() {
    isRepeatActive = !isRepeatActive;
    DOM.audioControls.btnRepeat.classList.toggle('active-control', isRepeatActive);
}

function manejarFinPista() {
    if (isRepeatActive) {
        currentAudio.currentTime = 0;
        currentAudio.play();
    } else {
        saltarSiguiente(); 
    }
}

function desordenarArrayMatematico(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- 9. GESTIÓN DE TIEMPO INTERACTIVO (OPCIÓN A) ---
function manejarTiempoAudio() {
    if (!currentAudio || isNaN(currentAudio.duration)) return;

    const porcentaje = (currentAudio.currentTime / currentAudio.duration) * 100;
    DOM.audioControls.scrubber.value = porcentaje;
    DOM.audioControls.progressFill.style.width = `${porcentaje}%`;
    DOM.miniPlayer.progressFill.style.width = `${porcentaje}%`;

    DOM.audioControls.timeCurrent.textContent = formatearSegundosAMinutos(currentAudio.currentTime);
    DOM.audioControls.timeTotal.textContent = formatearSegundosAMinutos(currentAudio.duration);
}

DOM.audioControls.scrubber.addEventListener('input', () => {
    if (!currentAudio || isNaN(currentAudio.duration)) return;
    const nuevoTiempo = (DOM.audioControls.scrubber.value / 100) * currentAudio.duration;
    currentAudio.currentTime = nuevoTiempo;
    DOM.audioControls.progressFill.style.width = `${DOM.audioControls.scrubber.value}%`;
});

// --- 10. CORAZÓN INTELIGENTE (FAVORITOS ❤️) ---
function conmutarFavorito() {
    if (colaReproduccion.length === 0 || indiceColaActual === null) return;
    const pistaActual = colaReproduccion[indiceColaActual];
    
    const indiceExistente = favoritos.findIndex(s => s.file === pistaActual.file);
    
    if (indiceExistente > -1) {
        favoritos.splice(indiceExistente, 1);
    } else {
        favoritos.push({ ...pistaActual });
    }
    
    guardarFavoritosEnStorage();
    evaluarEstadoCorazonFavorito();
}

function evaluarEstadoCorazonFavorito() {
    if (colaReproduccion.length === 0 || !currentAudio) return;
    const pistaActual = colaReproduccion[indiceColaActual];
    const existe = favoritos.some(s => s.file === pistaActual.file);
    
    DOM.fullPlayer.btnFavorite.classList.toggle('is-favorite', existe);
}

// --- 11. ACTUALIZACIONES VISUALES ---
function actualizarIconosPlayPause() {
    const iconName = isPlaying ? 'pause' : 'play';
    DOM.audioControls.btnPlay.innerHTML = `<i data-lucide="${iconName}"></i>`;
    DOM.miniPlayer.btnPlay.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons();
}

function actualizarFilaActivaResaltado() {
    document.querySelectorAll('.track-row').forEach(row => row.classList.remove('active-track'));
    if (currentAlbumIndex === null || colaReproduccion.length === 0) return;
    
    const cancionSonando = colaReproduccion[indiceColaActual];
    const indiceOriginal = albums[currentAlbumIndex].songs.findIndex(s => s.file === cancionSonando.file);

    const filaActiva = document.getElementById(`track-row-${indiceOriginal}`);
    if (filaActiva) filaActiva.classList.add('active-track');
}

function obtenerYAsignarDuracionMeta(rutaAudio, elementoSpan) {
    const audioDummy = new Audio(rutaAudio);
    audioDummy.addEventListener('loadedmetadata', () => {
        elementoSpan.textContent = formatearSegundosAMinutos(audioDummy.duration);
    });
}

function formatearSegundosAMinutos(segundosTotales) {
    if (isNaN(segundosTotales)) return "0:00";
    const min = Math.floor(segundosTotales / 60);
    const sec = Math.floor(segundosTotales % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

// --- 12. GESTIÓN INTERNA DEL MODAL DE PLAYLIST ---
function abrirModalPlaylist() {
    DOM.modal.input.value = ''; 
    if (DOM.modal.imgInput) DOM.modal.imgInput.value = ''; // Limpia el input de imagen
    DOM.modal.overlay.classList.remove('hidden');
    DOM.modal.input.focus(); 
}

function cerrarModalPlaylist() {
    DOM.modal.overlay.classList.add('hidden');
}

function confirmarCreacionPlaylist() {
    const nombre = DOM.modal.input.value.trim();
    
    if (nombre !== '') {
        if (!playlistsCreadas[nombre]) {
            const archivoImagen = DOM.modal.imgInput ? DOM.modal.imgInput.files[0] : null;

            if (archivoImagen) {
                // CORREGIDO: Conversión asíncrona de imagen a String Base64 para almacenamiento LocalStorage
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imagenBase64 = e.target.result;
                    playlistsCreadas[nombre] = {
                        canciones: [],
                        portada: imagenBase64
                    };
                    finalizarEstructuraPlaylist();
                };
                reader.readAsDataURL(archivoImagen);
            } else {
                // Portada por defecto si no se carga ningún archivo
                playlistsCreadas[nombre] = {
                    canciones: [],
                    portada: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"
                };
                finalizarEstructuraPlaylist();
            }
        } else {
            alert('Ya existe una playlist con ese nombre.'); 
        }
    }
}

function finalizarEstructuraPlaylist() {
    guardarPlaylistsEnStorage();
    cerrarModalPlaylist();
}

// --- 13. ESCUCHADORES DE INTERACCIONES FIJAS ---
function configurarEventosFijos() {
    // Controles de música principales
    DOM.audioControls.btnPlay.addEventListener('click', conmutarPlay);
    DOM.miniPlayer.btnPlay.addEventListener('click', conmutarPlay);
    DOM.audioControls.btnNext.addEventListener('click', saltarSiguiente);
    DOM.audioControls.btnPrev.addEventListener('click', saltarAnterior);
    DOM.audioControls.btnShuffle.addEventListener('click', conmutarAleatorio);
    DOM.audioControls.btnRepeat.addEventListener('click', conmutarBucle);
    DOM.fullPlayer.btnFavorite.addEventListener('click', conmutarFavorito);

    // Sidebar navegación básica
    DOM.sidebar.navHome.addEventListener('click', () => {
        closeAlbumView();
        actualizarResaltadoSidebar(DOM.sidebar.navHome);
    });

    DOM.sidebar.navFavorites.addEventListener('click', () => {
        cargarVistaFavoritos();
        actualizarResaltadoSidebar(DOM.sidebar.navFavorites);
    });

    // Vinculación del modal de Playlist a la barra lateral
    DOM.sidebar.btnCreatePlaylist.addEventListener('click', abrirModalPlaylist);

    // Controladores de los botones internos del modal
    DOM.modal.btnConfirm.addEventListener('click', confirmarCreacionPlaylist);
    DOM.modal.btnCancel.addEventListener('click', cerrarModalPlaylist);
    DOM.modal.btnClose.addEventListener('click', cerrarModalPlaylist);

    // Confirmar nombre de playlist al dar 'Enter' en el teclado
    DOM.modal.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmarCreacionPlaylist();
        }
    });

    // Cerrar el modal si el usuario hace clic en el área oscura de fuera
    DOM.modal.overlay.addEventListener('click', (e) => {
        if (e.target === DOM.modal.overlay) {
            cerrarModalPlaylist();
        }
    });

    // Mostrar / Ocultar la cola de reproducción lateral derecha
    DOM.queue.btnToggle.addEventListener('click', () => {
        DOM.queue.sidebar.classList.toggle('collapsed');
    });

    // Control del slider de volumen
    DOM.audioControls.volSlider.addEventListener('input', (e) => {
        if (currentAudio) currentAudio.volume = e.target.value / 100;
    });

    // Buscador instantáneo de álbumes
    DOM.views.searchBar.addEventListener('keyup', () => {
        const term = DOM.views.searchBar.value.toLowerCase();
        const cards = DOM.views.albumGrid.querySelectorAll('.album-card');
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const artist = card.querySelector('p').textContent.toLowerCase();
            card.style.display = (title.includes(term) || artist.includes(term)) ? "block" : "none";
        });
    });

    // Agregar opciones para añadir a la cola dentro del submenú
    DOM.contextMenu.btnAddToQueue.addEventListener('click', () => {
        if (activeContextTrack) {
            window.agregarCancionALaCola(activeContextTrack.albumIdx, activeContextTrack.songIdx);
            DOM.contextMenu.container.classList.add('hidden');
        }
    });
}

// Cerrar el reproductor inmersivo con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && !DOM.fullPlayer.container.classList.contains('hidden')) {
        window.minimizeFullPlayer();
    }
}); 