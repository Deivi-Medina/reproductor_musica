// --- CENTRALIZACIÓN DE ELEMENTOS DEL DOM ---

// Vistas principales y contenedores
export const mainLibrary = document.getElementById('mainLibrary');
export const albumDetailView = document.getElementById('albumDetailView');
export const tracksDynamicList = document.getElementById('tracksDynamicList');
export const searchInput = document.getElementById('globalSearch');
export const globalHeader = document.getElementById('globalHeader');
export const albumGrid = document.getElementById('albumGrid');

// Vistas Detalle del Álbum
export const detailAlbumCover = document.getElementById('detailAlbumCover');
export const detailAlbumTitle = document.getElementById('detailAlbumTitle');
export const detailAlbumArtist = document.getElementById('detailAlbumArtist');

// Mini Reproductor Inferior
export const miniPlayer = document.getElementById('miniPlayer');
export const miniCover = document.getElementById('miniCover');
export const miniTitle = document.getElementById('miniTitle');
export const miniArtist = document.getElementById('miniArtist');
export const btnMiniPlay = document.querySelector('.btn-mini-play');
export const miniProgressFill = document.getElementById('miniProgressFill');

// Reproductor Inmersivo (Overlay Completo)
export const playerOverlay = document.getElementById('playerOverlay');
export const currentTitle = document.getElementById('currentTitle');
export const currentArtist = document.getElementById('currentArtist');
export const currentCover = document.getElementById('currentCover');
export const timelineScrubber = document.getElementById('timelineScrubber');
export const timeCurrent = document.getElementById('timeCurrent');
export const timeTotal = document.getElementById('timeTotal');
export const waveContainer = document.getElementById('waveContainer');

// Botones de Control del Reproductor Grande
export const btnMainPlay = document.getElementById('btnMainPlay');
export const btnPrev = document.getElementById('btnPrev');
export const btnNext = document.getElementById('btnNext');
export const btnShuffle = document.getElementById('btnShuffle');
export const btnRepeat = document.getElementById('btnRepeat');
export const volSlider = document.querySelector('.vol-slider');
export const queueDynamicList = document.getElementById('queueDynamicList');