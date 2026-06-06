import { albums } from './canciones.js';
import * as DOM from './var.js'; // Ajustado al nombre de tu archivo de variables

// --- 1. ESTADO INTERNO DE LA APP ---
let currentAudio = null;
let currentAlbumIndex = null;
let isPlaying = false;

let isShuffleActive = false;
let isRepeatActive = false; 

let playlistActual = [];      
let colaReproduccion = [];    
let indiceColaActual = 0;     

// --- 2. SOLUCIÓN AL ERROR DE CLICS (MÉTODO GLOBAL) ---
window.agregarCancionALaCola = function(albumIdx, songIdx) {
    const cancionAAgregar = { ...albums[albumIdx].songs[songIdx] };
    
    // Guardamos las referencias del álbum original para el renderizado dinámico e independiente
    cancionAAgregar.artistName = albums[albumIdx].artist; 
    cancionAAgregar.albumCover = albums[albumIdx].cover;
    cancionAAgregar.originalAlbumIdx = albumIdx;
    
    colaReproduccion.push(cancionAAgregar);
    
    // Si no hay ningún elemento reproduciéndose, se inicia automáticamente
    if (!currentAudio) {
        currentAlbumIndex = albumIdx;
        indiceColaActual = colaReproduccion.length - 1;
        cargarYEjecutarPista();
        DOM.miniPlayer.classList.remove('hidden');
    } else {
        renderizarColaVisual();
    }
};

// --- 3. VISTAS DE LA INTERFAZ (LÓGICA UX) ---
window.openAlbumView = function(albumIndex) {
    currentAlbumIndex = albumIndex;
    const album = albums[albumIndex];

    DOM.detailAlbumTitle.textContent = album.title;
    DOM.detailAlbumArtist.textContent = album.artist;
    DOM.detailAlbumCover.src = album.cover;

    DOM.tracksDynamicList.innerHTML = '';

    album.songs.forEach((song, idx) => {
        const trackRow = document.createElement('div');
        trackRow.className = 'track-row';
        trackRow.id = `track-row-${idx}`;
        
        trackRow.onclick = () => iniciarReproduccionDesdeAlbum(idx);

        trackRow.innerHTML = `
            <span class="track-number">${idx + 1}</span>
            <span class="track-title">${song.trackTitle}</span>
            <span class="track-duration">--:--</span>
            <button class="btn-add-queue" title="Agregar a la cola" onclick="event.stopPropagation(); window.agregarCancionALaCola(${albumIndex}, ${idx})">
                <i data-lucide="plus"></i>
            </button>
        `;
        
        DOM.tracksDynamicList.appendChild(trackRow);
        obtenerYAsignarDuracionMeta(song.file, trackRow.querySelector('.track-duration'));
    });

    DOM.mainLibrary.classList.add('hidden');
    DOM.globalHeader.classList.add('hidden');
    DOM.albumDetailView.classList.remove('hidden');
    actualizarFilaActivaResaltado();
    lucide.createIcons();
};

window.closeAlbumView = function() {
    DOM.albumDetailView.classList.add('hidden');
    DOM.mainLibrary.classList.remove('hidden');
    DOM.globalHeader.classList.remove('hidden');
};

window.expandFullPlayer = function() {
    DOM.playerOverlay.classList.remove('hidden');
};

window.minimizeFullPlayer = function() {
    DOM.playerOverlay.classList.add('hidden');
};

// --- 4. RENDERIZAR COLA VISUAL (LATERAL DERECHO) ---
function renderizarColaVisual() {
    DOM.queueDynamicList.innerHTML = '';

    if (colaReproduccion.length === 0) {
        DOM.queueDynamicList.innerHTML = '<div class="queue-item">Cola vacía</div>';
        return;
    }

    colaReproduccion.forEach((song, idx) => {
        const queueItem = document.createElement('div');
        queueItem.className = `queue-item ${idx === indiceColaActual ? 'queue-active' : ''}`;
        
        queueItem.onclick = () => {
            indiceColaActual = idx;
            // Sincroniza el índice del álbum original si pertenece a otro disco mapeado
            if (song.originalAlbumIdx !== undefined) {
                currentAlbumIndex = song.originalAlbumIdx;
            }
            cargarYEjecutarPista();
        };

        queueItem.innerHTML = `
            <span class="queue-title">${song.trackTitle}</span>
            <span class="queue-artist">${song.artistName || albums[currentAlbumIndex].artist}</span>
        `;
        DOM.queueDynamicList.appendChild(queueItem);
    });
}

// --- 5. CONTROLADORES CENTRALES DE AUDIO ---
function iniciarReproduccionDesdeAlbum(indiceCancionPresionada) {
    const album = albums[currentAlbumIndex];
    
    playlistActual = album.songs.map(s => ({...s, artistName: album.artist, albumCover: album.cover, originalAlbumIdx: currentAlbumIndex}));
    colaReproduccion = album.songs.map(s => ({...s, artistName: album.artist, albumCover: album.cover, originalAlbumIdx: currentAlbumIndex}));

    if (isShuffleActive) {
        const cancionElegida = colaReproduccion.splice(indiceCancionPresionada, 1)[0];
        desordenarArrayMatematico(colaReproduccion);
        colaReproduccion.unshift(cancionElegida);
        indiceColaActual = 0;
    } else {
        indiceColaActual = indiceCancionPresionada;
    }

    cargarYEjecutarPista();
    DOM.miniPlayer.classList.remove('hidden');
}

function cargarYEjecutarPista() {
    if (colaReproduccion.length === 0) return;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeEventListener('timeupdate', manejarTiempoAudio);
        currentAudio.removeEventListener('ended', manejarFinPista);
    }

    const pistaActual = colaReproduccion[indiceColaActual];
    
    DOM.currentTitle.textContent = pistaActual.trackTitle;
    DOM.miniTitle.textContent = pistaActual.trackTitle;
    
    const caratulaAUsar = pistaActual.albumCover || albums[currentAlbumIndex].cover;
    DOM.currentCover.src = caratulaAUsar;
    DOM.miniCover.src = caratulaAUsar;
    
    const artistaAUsar = pistaActual.artistName || albums[currentAlbumIndex].artist;
    DOM.currentArtist.textContent = artistaAUsar;
    DOM.miniArtist.textContent = artistaAUsar;

    currentAudio = new Audio(pistaActual.file);
    currentAudio.volume = DOM.volSlider.value / 100;

    currentAudio.addEventListener('timeupdate', manejarTiempoAudio);
    currentAudio.addEventListener('ended', manejarFinPista);

    currentAudio.play()
        .then(() => {
            isPlaying = true;
            actualizarIconosPlayPause();
            generateWaves();
            actualizarFilaActivaResaltado();
            renderizarColaVisual(); 
        })
        .catch(err => console.error("Error al decodificar audio:", err));
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
    indiceColaActual = (indiceColaActual + 1) % colaReproduccion.length;
    cargarYEjecutarPista();
}

function saltarAnterior() {
    if (colaReproduccion.length === 0) return;
    indiceColaActual = (indiceColaActual - 1 + colaReproduccion.length) % colaReproduccion.length;
    cargarYEjecutarPista();
}

// --- 6. ALGORITMOS DE MODOS AVANZADOS ---
function conmutarAleatorio() {
    isShuffleActive = !isShuffleActive;
    DOM.btnShuffle.classList.toggle('active-control', isShuffleActive);

    if (colaReproduccion.length === 0) return;

    const pistaSonando = colaReproduccion[indiceColaActual];

    if (isShuffleActive) {
        colaReproduccion = colaReproduccion.filter(song => song.file !== pistaSonando.file);
        desordenarArrayMatematico(colaReproduccion);
        colaReproduccion.unshift(pistaSonando);
        indiceColaActual = 0;
    } else {
        colaReproduccion = [...playlistActual];
        indiceColaActual = colaReproduccion.findIndex(song => song.file === pistaSonando.file);
    }
    renderizarColaVisual();
}

function conmutarBucle() {
    isRepeatActive = !isRepeatActive;
    DOM.btnRepeat.classList.toggle('active-control', isRepeatActive);
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

// --- 7. GESTIÓN Y MANEJO DEL TIEMPO ---
function manejarTiempoAudio() {
    if (!currentAudio || isNaN(currentAudio.duration)) return;

    const porcentaje = (currentAudio.currentTime / currentAudio.duration) * 100;
    DOM.timelineScrubber.value = porcentaje;
    DOM.miniProgressFill.style.width = `${porcentaje}%`;

    actualizarOndasSegunProgreso(porcentaje);

    DOM.timeCurrent.textContent = formatearSegundosAMinutos(currentAudio.currentTime);
    DOM.timeTotal.textContent = formatearSegundosAMinutos(currentAudio.duration);
}

DOM.timelineScrubber.addEventListener('input', () => {
    if (!currentAudio || isNaN(currentAudio.duration)) return;
    const nuevoTiempo = (DOM.timelineScrubber.value / 100) * currentAudio.duration;
    currentAudio.currentTime = nuevoTiempo;
});

function actualizarOndasSegunProgreso(porcentaje) {
    const barrasOnda = document.querySelectorAll('.wave-bar');
    const barrasAColorear = Math.floor((porcentaje / 100) * barrasOnda.length);

    barrasOnda.forEach((bar, index) => {
        if (index <= barrasAColorear) {
            bar.style.backgroundColor = 'var(--blue-accent)';
            bar.style.opacity = '0.9';
        } else {
            bar.style.backgroundColor = 'rgba(224, 230, 237, 0.4)';
            bar.style.opacity = '0.4';
        }
    });
}

// --- 8. ACTUALIZACIONES DE COMPONENTES ---
function actualizarIconosPlayPause() {
    const htmlIcon = isPlaying ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
    DOM.btnMainPlay.innerHTML = htmlIcon;
    DOM.btnMiniPlay.innerHTML = htmlIcon;
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

// --- 9. ESCUCHADORES DE INTERACCIONES GLOBALES ---
DOM.btnMainPlay.addEventListener('click', conmutarPlay);
DOM.btnMiniPlay.addEventListener('click', conmutarPlay);
DOM.btnNext.addEventListener('click', saltarSiguiente);
DOM.btnPrev.addEventListener('click', saltarAnterior);
DOM.btnShuffle.addEventListener('click', conmutarAleatorio);
DOM.btnRepeat.addEventListener('click', conmutarBucle);

DOM.volSlider.addEventListener('input', (e) => {
    if (currentAudio) currentAudio.volume = e.target.value / 100;
});

DOM.searchInput.addEventListener('keyup', () => {
    const term = DOM.searchInput.value.toLowerCase();
    const cards = DOM.albumGrid.querySelectorAll('.album-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const artist = card.querySelector('p').textContent.toLowerCase();
        card.style.display = (title.includes(term) || artist.includes(term)) ? "block" : "none";
    });
});

function generateWaves() {
    DOM.waveContainer.innerHTML = '';
    const totalBars = 65; 
    for (let i = 0; i < totalBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        const height = Math.random() * 35 + 10;
        bar.style.height = `${height}px`;
        bar.style.width = '3px';
        bar.style.backgroundColor = 'rgba(224, 230, 237, 0.4)';
        bar.style.borderRadius = '2px';
        bar.style.marginRight = '3px';
        bar.style.animation = `waveAnim ${Math.random() * 0.4 + 0.4}s ease-in-out infinite alternate`;
        bar.style.animationDelay = `${Math.random() * 0.4}s`;
        DOM.waveContainer.appendChild(bar);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && !DOM.playerOverlay.classList.contains('hidden')) {
        window.minimizeFullPlayer();
    }
});