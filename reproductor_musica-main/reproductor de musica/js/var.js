// --- CENTRALIZACIÓN DE ELEMENTOS DEL DOM (OBJETO UNIFICADO) ---

const DOM = {
    // Barra Lateral Izquierda (Navegación)
    sidebar: {
        navHome: document.getElementById('navHome'),
        navFavorites: document.getElementById('navFavorites'),
        btnCreatePlaylist: document.getElementById('btnCreatePlaylist'),
        playlistsContainer: document.getElementById('playlistsDynamicContainer')
    },

    // Vistas Principales y Contenedores
    views: {
        library: document.getElementById('mainLibrary'),
        albumDetail: document.getElementById('albumDetailView'),
        tracksList: document.getElementById('tracksDynamicList'),
        albumGrid: document.getElementById('albumGrid'),
        header: document.getElementById('globalHeader'),
        searchBar: document.getElementById('globalSearch')
    },

    // Detalle del Álbum / Playlist Activa
    currentAlbumDetail: {
        cover: document.getElementById('detailAlbumCover'),
        title: document.getElementById('detailAlbumTitle'),
        artist: document.getElementById('detailAlbumArtist')
    },

    // Menú Contextual Desplegable (Pop-over)
    contextMenu: {
        container: document.getElementById('contextMenuContainer'),
        btnAddToQueue: document.getElementById('ctxAddToQueue'),
        playlistsList: document.getElementById('ctxPlaylistsList')
    },

    // Mini Reproductor Inferior
    miniPlayer: {
        container: document.getElementById('miniPlayer'),
        cover: document.getElementById('miniCover'),
        title: document.getElementById('miniTitle'),
        artist: document.getElementById('miniArtist'),
        btnPlay: document.getElementById('btnMiniPlay'),
        progressFill: document.getElementById('miniProgressFill')
    },

    // Reproductor Inmersivo (Overlay Completo)
    fullPlayer: {
        container: document.getElementById('playerOverlay'),
        title: document.getElementById('currentTitle'),
        artist: document.getElementById('currentArtist'),
        cover: document.getElementById('currentCover'),
        btnFavorite: document.getElementById('btnMainFavorite')
    },

    // Línea de Tiempo Premium y Controles de Audio
    audioControls: {
        scrubber: document.getElementById('timelineScrubber'),
        progressFill: document.getElementById('premiumProgressFill'),
        timeCurrent: document.getElementById('timeCurrent'),
        timeTotal: document.getElementById('timeTotal'),
        btnPlay: document.getElementById('btnMainPlay'),
        btnPrev: document.getElementById('btnPrev'),
        btnNext: document.getElementById('btnNext'),
        btnShuffle: document.getElementById('btnShuffle'),
        btnRepeat: document.getElementById('btnRepeat'),
        volSlider: document.getElementById('volSlider')
    },

    // Cola de Reproducción Lateral Derecha
    queue: {
        sidebar: document.getElementById('queueSidebar'),
        btnToggle: document.getElementById('btnToggleQueueSidebar'),
        dynamicList: document.getElementById('queueDynamicList')
    },

    // Modal de Creación de Playlists
    modal: {
        overlay: document.getElementById('playlistModal'),
        input: document.getElementById('modalPlaylistName'),
        imgInput: document.getElementById('imagenPlaylistInput'), // <-- NUEVA VARIABLE MAPEADA
        btnConfirm: document.getElementById('btnModalConfirm'),
        btnCancel: document.getElementById('btnModalCancel'),
        btnClose: document.getElementById('btnModalClose')
    }
};

// Congelamos el objeto para evitar mutaciones accidentales en la app
export default Object.freeze(DOM);