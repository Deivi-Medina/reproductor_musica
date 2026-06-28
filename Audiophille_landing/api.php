<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$frontend_origin = 'http://127.0.0.1:5500';
header('Access-Control-Allow-Origin: ' . $frontend_origin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Database.php';

session_start();

if (empty($_POST)) {
    $input = file_get_contents('php://input');
    if ($input) {
        $_POST = json_decode($input, true) ?? [];
    }
}

$user_id = $_SESSION['user_id'] ?? null;
$action = $_GET['action'] ?? $_POST['action'] ?? '';

$public_actions = ['get_initial_data'];

if (!in_array($action, $public_actions) && !$user_id) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$database = new Database();
$pdo = $database->getConnection();

function sendJson($data)
{
    echo json_encode($data);
    exit;
}

// ==================== SWITCH PRINCIPAL ====================
switch ($action) {
    // ----- FUNCIONES EXISTENTES -----
    case 'get_initial_data':
        getInitialData($pdo, $user_id);
        break;
    case 'create_playlist':
        createPlaylist($pdo, $user_id, $_POST, $_FILES);
        break;
    case 'add_to_playlist':
        addToPlaylist($pdo, $user_id, $_POST);
        break;
    case 'remove_from_playlist':
        removeFromPlaylist($pdo, $user_id, $_POST);
        break;
    case 'delete_playlist':
        deletePlaylist($pdo, $user_id, $_POST);
        break;
    case 'update_playlist':
        updatePlaylist($pdo, $user_id, $_POST, $_FILES);
        break;
    case 'toggle_favorite':
        toggleFavorite($pdo, $user_id, $_POST);
        break;
    case 'save_review':
        saveReview($pdo, $user_id, $_POST);
        break;
    case 'delete_review':
        deleteReview($pdo, $user_id, $_POST);
        break;
    case 'update_review':
        updateReview($pdo, $user_id, $_POST);
        break;
    case 'get_reviews':
        getReviews($pdo, $user_id);
        break;
    case 'import_song':
        importSong($pdo, $user_id, $_FILES);
        break;
    case 'update_eq':
        updateEq($pdo, $user_id, $_POST);
        break;
    case 'get_eq':
        getEq($pdo, $user_id);
        break;
    case 'toggle_follow_artist':
        toggleFollowArtist($pdo, $user_id, $_POST);
        break;
    case 'register_play':
        registerPlay($pdo, $user_id, $_POST);
        break;
    case 'get_top_artist':
        getTopArtist($pdo, $user_id);
        break;
    case 'get_play_stats':
        getPlayStats($pdo, $user_id);
        break;
    case 'create_album':
        createAlbum($pdo, $user_id, $_POST, $_FILES);
        break;
    case 'update_album':
        updateAlbum($pdo, $user_id, $_POST, $_FILES);
        break;
    case 'delete_album':
        deleteAlbum($pdo, $user_id, $_POST);
        break;
    case 'get_user_profile':
        getUserProfile($pdo, $user_id);
        break;
    case 'update_user_profile':
        updateUserProfile($pdo, $user_id, $_POST, $_FILES);
        break;
    case 'get_user_stats':
        getUserStats($pdo, $user_id);
        break;

    // ----- FUNCIONES SOCIALES -----
    case 'get_public_profile':
        getPublicProfile($pdo, $user_id, $_GET);
        break;
    case 'toggle_follow_user':
        toggleFollowUser($pdo, $user_id, $_POST);
        break;
    case 'get_followers':
        getFollowers($pdo, $user_id, $_GET);
        break;
    case 'get_following':
        getFollowing($pdo, $user_id, $_GET);
        break;
    case 'get_feed':
        getFeed($pdo, $user_id, $_GET);
        break;
    case 'explore_users':
        exploreUsers($pdo, $user_id, $_GET);
        break;
    case 'add_playlist_to_library':
        addPlaylistToLibrary($pdo, $user_id, $_POST);
        break;
    case 'merge_playlists':
        mergePlaylists($pdo, $user_id, $_POST);
        break;
    case 'check_friends':
        checkFriends($pdo, $user_id, $_GET);
        break;
    case 'is_following':
        isFollowing($pdo, $user_id, $_GET);
        break;
    case 'check_merged_playlist':
        checkMergedPlaylist($pdo, $user_id, $_GET);
        break;

    default:
        sendJson(['success' => false, 'message' => 'Acción no soportada: ' . $action]);
}

// ============================================================
// FUNCIONES EXISTENTES (sin cambios, pero con try-catch)
// ============================================================

function getInitialData($pdo, $user_id)
{
    try {
        $stmt = $pdo->prepare("
            SELECT a.id_album, a.titulo, a.anio, a.caratula_url, a.genero,
                   ar.nombre_artista as artista
            FROM albumes a
            JOIN artistas ar ON a.id_artista = ar.id_artista
            WHERE a.es_sistema = 1 OR (a.es_sistema = 0 AND a.id_usuario = ?)
            ORDER BY a.id_album
        ");
        $stmt->execute([$user_id ?: 0]);
        $albumes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($albumes as &$album) {
            $stmt2 = $pdo->prepare("
                SELECT id_cancion, titulo, archivo_url, duracion_segundos, numero_pista, genero
                FROM canciones
                WHERE id_album = ?
                ORDER BY numero_pista
            ");
            $stmt2->execute([$album['id_album']]);
            $album['songs'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        }

        $playlists = [];
        $favoritos = [];
        $reseñas = [];
        $eq = null;
        $importadas = [];
        $followed_artists = [];

        if ($user_id) {
            $stmt = $pdo->prepare("SELECT id_playlist, nombre, portada_url FROM playlists WHERE id_usuario = ?");
            $stmt->execute([$user_id]);
            $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($playlists as &$pl) {
                $stmt2 = $pdo->prepare("
                    SELECT c.id_cancion, c.titulo, c.archivo_url, c.duracion_segundos,
                           COALESCE(ar.nombre_artista, 'Artista') as artista_nombre,
                           COALESCE(a.caratula_url, '') as album_cover
                    FROM playlist_canciones pc
                    JOIN canciones c ON pc.id_cancion = c.id_cancion
                    LEFT JOIN albumes a ON c.id_album = a.id_album
                    LEFT JOIN artistas ar ON a.id_artista = ar.id_artista
                    WHERE pc.id_playlist = ?
                    ORDER BY pc.orden
                ");
                $stmt2->execute([$pl['id_playlist']]);
                $pl['canciones'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            }

            $stmt = $pdo->prepare("SELECT id_cancion FROM favoritos WHERE id_usuario = ?");
            $stmt->execute([$user_id]);
            $favoritos = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $stmt = $pdo->prepare("
                SELECT r.id_review, r.puntuacion, r.comentario, r.fecha, r.escuchada_nuevamente,
                       r.titulo_cancion_texto, r.artista_texto,
                       COALESCE(a.caratula_url, '') as albumCover
                FROM resenas r
                JOIN canciones c ON r.id_cancion = c.id_cancion
                LEFT JOIN albumes a ON c.id_album = a.id_album
                WHERE r.id_usuario = ?
                ORDER BY r.fecha DESC
            ");
            $stmt->execute([$user_id]);
            $reseñas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("SELECT bass, vocals, treble FROM configuracion_eq WHERE id_usuario = ?");
            $stmt->execute([$user_id]);
            $eq = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("
                SELECT id_cancion, titulo, archivo_url, duracion_segundos, genero
                FROM canciones
                WHERE es_sistema = 0 AND id_usuario_subio = ?
            ");
            $stmt->execute([$user_id]);
            $importadas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("SELECT nombre_artista FROM artistas_seguidos WHERE id_usuario = ?");
            $stmt->execute([$user_id]);
            $followed_artists = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }

        sendJson([
            'success' => true,
            'albumes' => $albumes,
            'playlists' => $playlists,
            'favoritos' => $favoritos,
            'reseñas' => $reseñas,
            'eq' => $eq ?: ['bass' => 0, 'vocals' => 0, 'treble' => 0],
            'importadas' => $importadas,
            'followed_artists' => $followed_artists,
            'user_id' => $user_id
        ]);
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error en getInitialData: ' . $e->getMessage()]);
    }
}

function createPlaylist($pdo, $user_id, $data, $files)
{
    try {
        $nombre = trim($data['nombre'] ?? '');
        if (!$nombre) sendJson(['success' => false, 'message' => 'Nombre de playlist requerido']);

        $portada_url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400';
        if (isset($files['portada_file']) && $files['portada_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/playlists/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($files['portada_file']['name'], PATHINFO_EXTENSION);
            $filename = 'playlist_' . time() . '_' . uniqid() . '.' . $ext;
            if (move_uploaded_file($files['portada_file']['tmp_name'], $uploadDir . $filename)) {
                $portada_url = 'uploads/playlists/' . $filename;
            } else {
                sendJson(['success' => false, 'message' => 'Error al guardar la imagen']);
                return;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url) VALUES (?, ?, ?)");
        $stmt->execute([$nombre, $user_id, $portada_url]);
        sendJson(['success' => true, 'id_playlist' => $pdo->lastInsertId(), 'nombre' => $nombre, 'portada' => $portada_url]);
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

function addToPlaylist($pdo, $user_id, $data)
{
    $id_playlist = $data['id_playlist'] ?? 0;
    $id_cancion = $data['id_cancion'] ?? 0;
    if (!$id_playlist || !$id_cancion) sendJson(['success' => false, 'message' => 'Datos incompletos']);
    $stmt = $pdo->prepare("SELECT id_usuario FROM playlists WHERE id_playlist = ?");
    $stmt->execute([$id_playlist]);
    if ($stmt->fetchColumn() != $user_id) sendJson(['success' => false, 'message' => 'No autorizado']);
    $stmt = $pdo->prepare("INSERT IGNORE INTO playlist_canciones (id_playlist, id_cancion) VALUES (?, ?)");
    $stmt->execute([$id_playlist, $id_cancion]);
    sendJson(['success' => true]);
}

function removeFromPlaylist($pdo, $user_id, $data)
{
    $id_playlist = $data['id_playlist'] ?? 0;
    $id_cancion = $data['id_cancion'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM playlist_canciones WHERE id_playlist = ? AND id_cancion = ?");
    $stmt->execute([$id_playlist, $id_cancion]);
    sendJson(['success' => true]);
}

function deletePlaylist($pdo, $user_id, $data)
{
    $id_playlist = $data['id_playlist'] ?? 0;
    if (!$id_playlist && isset($data['nombre'])) {
        $nombre = trim($data['nombre']);
        $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE nombre = ? AND id_usuario = ?");
        $stmt->execute([$nombre, $user_id]);
        $id_playlist = $stmt->fetchColumn();
        if (!$id_playlist) {
            sendJson(['success' => false, 'message' => 'Playlist no encontrada']);
            return;
        }
    }
    if (!$id_playlist) {
        sendJson(['success' => false, 'message' => 'ID de playlist requerido']);
        return;
    }
    $stmt = $pdo->prepare("DELETE FROM playlists WHERE id_playlist = ? AND id_usuario = ?");
    $stmt->execute([$id_playlist, $user_id]);
    sendJson(['success' => true]);
}

function updatePlaylist($pdo, $user_id, $data, $files)
{
    $id_playlist = $data['id_playlist'] ?? 0;
    $nombre = trim($data['nombre'] ?? '');
    $portada_url = $data['portada_url'] ?? '';
    $canciones = isset($data['canciones']) ? json_decode($data['canciones'], true) : [];

    if (!$id_playlist || !$nombre) sendJson(['success' => false, 'message' => 'ID y nombre requeridos']);
    $stmt = $pdo->prepare("SELECT id_usuario FROM playlists WHERE id_playlist = ?");
    $stmt->execute([$id_playlist]);
    if ($stmt->fetchColumn() != $user_id) sendJson(['success' => false, 'message' => 'No autorizado']);

    if (isset($files['cover_file']) && $files['cover_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/playlists/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($files['cover_file']['name'], PATHINFO_EXTENSION);
        $filename = 'playlist_' . time() . '_' . uniqid() . '.' . $ext;
        if (move_uploaded_file($files['cover_file']['tmp_name'], $uploadDir . $filename)) {
            $portada_url = 'uploads/playlists/' . $filename;
        } else {
            sendJson(['success' => false, 'message' => 'Error al guardar la imagen']);
            return;
        }
    }

    $sql = "UPDATE playlists SET nombre = ?";
    $params = [$nombre];
    if (!empty($portada_url)) {
        $sql .= ", portada_url = ?";
        $params[] = $portada_url;
    }
    $sql .= " WHERE id_playlist = ? AND id_usuario = ?";
    $params[] = $id_playlist;
    $params[] = $user_id;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $stmt = $pdo->prepare("DELETE FROM playlist_canciones WHERE id_playlist = ?");
    $stmt->execute([$id_playlist]);
    foreach ($canciones as $idx => $id_cancion) {
        if ($id_cancion) {
            $stmt = $pdo->prepare("INSERT INTO playlist_canciones (id_playlist, id_cancion, orden) VALUES (?, ?, ?)");
            $stmt->execute([$id_playlist, $id_cancion, $idx]);
        }
    }
    sendJson(['success' => true]);
}

function toggleFavorite($pdo, $user_id, $data)
{
    $id_cancion = $data['id_cancion'] ?? 0;
    if (!$id_cancion) sendJson(['success' => false]);
    $stmt = $pdo->prepare("SELECT 1 FROM favoritos WHERE id_usuario = ? AND id_cancion = ?");
    $stmt->execute([$user_id, $id_cancion]);
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->prepare("DELETE FROM favoritos WHERE id_usuario = ? AND id_cancion = ?");
        $stmt->execute([$user_id, $id_cancion]);
        sendJson(['success' => true, 'favorito' => false]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO favoritos (id_usuario, id_cancion) VALUES (?, ?)");
        $stmt->execute([$user_id, $id_cancion]);
        sendJson(['success' => true, 'favorito' => true]);
    }
}

function saveReview($pdo, $user_id, $data)
{
    $id_cancion = $data['id_cancion'] ?? 0;
    $puntuacion = floatval($data['puntuacion'] ?? 5);
    $comentario = trim($data['comentario'] ?? '');
    $rewatch = isset($data['rewatch']) ? 1 : 0;
    $titulo_texto = $data['titulo_texto'] ?? '';
    $artista_texto = $data['artista_texto'] ?? '';
    if (!$id_cancion || !$comentario) sendJson(['success' => false, 'message' => 'Faltan datos']);
    $stmt = $pdo->prepare("INSERT INTO resenas (id_usuario, id_cancion, puntuacion, comentario, escuchada_nuevamente, titulo_cancion_texto, artista_texto) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $id_cancion, $puntuacion, $comentario, $rewatch, $titulo_texto, $artista_texto]);
    sendJson(['success' => true, 'id_review' => $pdo->lastInsertId()]);
}

function deleteReview($pdo, $user_id, $data)
{
    $id_review = $data['id_review'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM resenas WHERE id_review = ? AND id_usuario = ?");
    $stmt->execute([$id_review, $user_id]);
    sendJson(['success' => true]);
}

function updateReview($pdo, $user_id, $data)
{
    $id_review = $data['id_review'] ?? 0;
    $puntuacion = floatval($data['puntuacion'] ?? 5);
    $comentario = trim($data['comentario'] ?? '');
    $rewatch = isset($data['rewatch']) ? 1 : 0;
    $stmt = $pdo->prepare("UPDATE resenas SET puntuacion = ?, comentario = ?, escuchada_nuevamente = ? WHERE id_review = ? AND id_usuario = ?");
    $stmt->execute([$puntuacion, $comentario, $rewatch, $id_review, $user_id]);
    sendJson(['success' => true]);
}

function getReviews($pdo, $user_id)
{
    $stmt = $pdo->prepare("
        SELECT r.id_review, r.puntuacion, r.comentario, r.fecha, r.escuchada_nuevamente,
               r.titulo_cancion_texto, r.artista_texto,
               COALESCE(a.caratula_url, '') as albumCover
        FROM resenas r
        JOIN canciones c ON r.id_cancion = c.id_cancion
        LEFT JOIN albumes a ON c.id_album = a.id_album
        WHERE r.id_usuario = ?
        ORDER BY r.fecha DESC
    ");
    $stmt->execute([$user_id]);
    sendJson(['success' => true, 'reviews' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function importSong($pdo, $user_id, $files)
{
    if (!isset($files['audio']) || $files['audio']['error'] !== UPLOAD_ERR_OK) {
        sendJson(['success' => false, 'message' => 'No se recibió archivo']);
    }
    $uploadDir = __DIR__ . '/uploads/audios/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
    $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($files['audio']['name']));
    $target = $uploadDir . $filename;
    if (move_uploaded_file($files['audio']['tmp_name'], $target)) {
        $titulo = pathinfo($files['audio']['name'], PATHINFO_FILENAME);
        $stmt = $pdo->prepare("INSERT INTO canciones (titulo, archivo_url, es_sistema, id_usuario_subio) VALUES (?, ?, 0, ?)");
        $stmt->execute([$titulo, $target, $user_id]);
        sendJson(['success' => true, 'id_cancion' => $pdo->lastInsertId(), 'titulo' => $titulo, 'url' => $target]);
    } else {
        sendJson(['success' => false, 'message' => 'Error al guardar archivo']);
    }
}

function updateEq($pdo, $user_id, $data)
{
    $bass = intval($data['bass'] ?? 0);
    $vocals = intval($data['vocals'] ?? 0);
    $treble = intval($data['treble'] ?? 0);
    $stmt = $pdo->prepare("INSERT INTO configuracion_eq (id_usuario, bass, vocals, treble) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE bass = VALUES(bass), vocals = VALUES(vocals), treble = VALUES(treble)");
    $stmt->execute([$user_id, $bass, $vocals, $treble]);
    sendJson(['success' => true]);
}

function getEq($pdo, $user_id)
{
    $stmt = $pdo->prepare("SELECT bass, vocals, treble FROM configuracion_eq WHERE id_usuario = ?");
    $stmt->execute([$user_id]);
    $eq = $stmt->fetch(PDO::FETCH_ASSOC);
    sendJson(['success' => true, 'eq' => $eq ?: ['bass' => 0, 'vocals' => 0, 'treble' => 0]]);
}

function toggleFollowArtist($pdo, $user_id, $data)
{
    $artistName = trim($data['artist_name'] ?? '');
    $follow = isset($data['follow']) ? (bool)$data['follow'] : false;
    if (!$artistName) sendJson(['success' => false, 'message' => 'Nombre de artista requerido']);
    if ($follow) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO artistas_seguidos (id_usuario, nombre_artista) VALUES (?, ?)");
        $stmt->execute([$user_id, $artistName]);
    } else {
        $stmt = $pdo->prepare("DELETE FROM artistas_seguidos WHERE id_usuario = ? AND nombre_artista = ?");
        $stmt->execute([$user_id, $artistName]);
    }
    sendJson(['success' => true]);
}

function registerPlay($pdo, $user_id, $data)
{
    $artistName = trim($data['nombre_artista'] ?? '');
    $idArtista = $data['id_artista'] ?? 0;
    if ($idArtista) {
        $stmt = $pdo->prepare("INSERT INTO reproducciones_artista (id_usuario, id_artista, fecha) VALUES (?, ?, NOW())");
        $stmt->execute([$user_id, $idArtista]);
    } elseif ($artistName) {
        $stmt = $pdo->prepare("INSERT INTO reproducciones_artista (id_usuario, nombre_artista, fecha) VALUES (?, ?, NOW())");
        $stmt->execute([$user_id, $artistName]);
    } else {
        sendJson(['success' => false, 'message' => 'No se especificó artista']);
    }
    sendJson(['success' => true]);
}

function getTopArtist($pdo, $user_id)
{
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(r.nombre_artista, res.artista_texto) as artista,
                COUNT(DISTINCT r.id_reproduccion) + COALESCE(AVG(res.puntuacion), 0) * 3 as puntuacion,
                COUNT(DISTINCT r.id_reproduccion) as reproducciones,
                ROUND(COALESCE(AVG(res.puntuacion), 0), 1) as rating_promedio
            FROM (
                SELECT id_reproduccion, nombre_artista, id_usuario
                FROM reproducciones_artista
                WHERE id_usuario = ?
            ) r
            LEFT JOIN resenas res ON res.id_usuario = r.id_usuario AND res.artista_texto = r.nombre_artista
            GROUP BY artista
            ORDER BY puntuacion DESC
            LIMIT 1
        ");
        $stmt->execute([$user_id]);
        $top = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($top && !empty($top['artista'])) {
            sendJson([
                'success' => true,
                'artista' => $top['artista'],
                'puntuacion' => round($top['puntuacion'], 1),
                'reproducciones' => (int)$top['reproducciones'],
                'ratingPromedio' => (float)$top['rating_promedio']
            ]);
        } else {
            sendJson([
                'success' => true,
                'artista' => 'Ninguno todavía',
                'puntuacion' => 0,
                'reproducciones' => 0,
                'ratingPromedio' => 0
            ]);
        }
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error en getTopArtist: ' . $e->getMessage()]);
    }
}

function getPlayStats($pdo, $user_id)
{
    $stmt = $pdo->prepare("SELECT nombre_artista, COUNT(*) as plays FROM reproducciones_artista WHERE id_usuario = ? AND nombre_artista IS NOT NULL GROUP BY nombre_artista");
    $stmt->execute([$user_id]);
    $stats = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    sendJson(['success' => true, 'plays' => $stats]);
}

function createAlbum($pdo, $user_id, $data, $files)
{
    try {
        $titulo = trim($data['titulo'] ?? '');
        $artista = trim($data['artista'] ?? '');
        $coverUrl = $data['cover_url'] ?? '';
        $coverFile = $files['cover_file'] ?? null;

        if (!$titulo || !$artista) {
            sendJson(['success' => false, 'message' => 'Título y artista son requeridos']);
        }

        $stmt = $pdo->prepare("SELECT id_artista FROM artistas WHERE nombre_artista = ?");
        $stmt->execute([$artista]);
        $idArtista = $stmt->fetchColumn();
        if (!$idArtista) {
            $stmt = $pdo->prepare("INSERT INTO artistas (nombre_artista) VALUES (?)");
            $stmt->execute([$artista]);
            $idArtista = $pdo->lastInsertId();
        }

        if ($coverFile && $coverFile['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/uploads/covers/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $ext = pathinfo($coverFile['name'], PATHINFO_EXTENSION);
            $filename = 'album_' . time() . '_' . uniqid() . '.' . $ext;
            if (move_uploaded_file($coverFile['tmp_name'], $uploadDir . $filename)) {
                $coverUrl = 'uploads/covers/' . $filename;
            } else {
                sendJson(['success' => false, 'message' => 'Error al guardar la portada']);
                return;
            }
        } elseif (empty($coverUrl)) {
            $coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400';
        }

        $stmt = $pdo->prepare("INSERT INTO albumes (titulo, id_artista, caratula_url, genero, anio, es_sistema, id_usuario) VALUES (?, ?, ?, ?, ?, 0, ?)");
        $stmt->execute([$titulo, $idArtista, $coverUrl, $data['genero'] ?? null, $data['anio'] ?? null, $user_id]);
        $idAlbum = $pdo->lastInsertId();

        $cancionesCount = intval($data['songs_count'] ?? 0);
        for ($i = 0; $i < $cancionesCount; $i++) {
            $songTitle = $data["song_{$i}_title"] ?? '';
            $songFile = $files["song_{$i}_file"] ?? null;
            if ($songTitle && $songFile && $songFile['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/uploads/audios/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
                $ext = pathinfo($songFile['name'], PATHINFO_EXTENSION);
                $filename = 'song_' . time() . '_' . $i . '_' . uniqid() . '.' . $ext;
                if (move_uploaded_file($songFile['tmp_name'], $uploadDir . $filename)) {
                    $audioPath = 'uploads/audios/' . $filename;
                    $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, es_sistema, id_usuario_subio, numero_pista) VALUES (?, ?, ?, 0, ?, ?)");
                    $stmt->execute([$songTitle, $idAlbum, $audioPath, $user_id, $i + 1]);
                } else {
                    error_log("Error al subir canción: " . $songFile['name']);
                }
            }
        }
        sendJson(['success' => true, 'id_album' => $idAlbum]);
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error al crear álbum: ' . $e->getMessage()]);
    }
}

function updateAlbum($pdo, $user_id, $data, $files)
{
    $idAlbum = $data['id_album'] ?? 0;
    if (!$idAlbum) sendJson(['success' => false, 'message' => 'ID de álbum requerido']);

    $stmt = $pdo->prepare("SELECT es_sistema FROM albumes WHERE id_album = ?");
    $stmt->execute([$idAlbum]);
    if ($stmt->fetchColumn()) {
        sendJson(['success' => false, 'message' => 'No se pueden editar álbumes del sistema']);
    }

    $titulo = trim($data['titulo'] ?? '');
    $artista = trim($data['artista'] ?? '');
    $caratula = $data['caratula'] ?? '';

    if ($titulo) {
        $stmt = $pdo->prepare("UPDATE albumes SET titulo = ? WHERE id_album = ?");
        $stmt->execute([$titulo, $idAlbum]);
    }

    if ($artista) {
        $stmt = $pdo->prepare("SELECT id_artista FROM artistas WHERE nombre_artista = ?");
        $stmt->execute([$artista]);
        $idArtista = $stmt->fetchColumn();
        if (!$idArtista) {
            $stmt = $pdo->prepare("INSERT INTO artistas (nombre_artista) VALUES (?)");
            $stmt->execute([$artista]);
            $idArtista = $pdo->lastInsertId();
        }
        $stmt = $pdo->prepare("UPDATE albumes SET id_artista = ? WHERE id_album = ?");
        $stmt->execute([$idArtista, $idAlbum]);
    }

    if (isset($files['cover_file']) && $files['cover_file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/covers/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($files['cover_file']['name'], PATHINFO_EXTENSION);
        $filename = 'album_' . time() . '_' . uniqid() . '.' . $ext;
        if (move_uploaded_file($files['cover_file']['tmp_name'], $uploadDir . $filename)) {
            $caratula = 'uploads/covers/' . $filename;
        } else {
            sendJson(['success' => false, 'message' => 'Error al guardar la portada']);
            return;
        }
    }

    if ($caratula) {
        $stmt = $pdo->prepare("UPDATE albumes SET caratula_url = ? WHERE id_album = ?");
        $stmt->execute([$caratula, $idAlbum]);
    }

    if (isset($data['canciones'])) {
        $canciones = json_decode($data['canciones'], true);
        if (is_array($canciones)) {
            $stmt = $pdo->prepare("DELETE FROM canciones WHERE id_album = ? AND es_sistema = 0");
            $stmt->execute([$idAlbum]);
            foreach ($canciones as $idx => $song) {
                if (!empty($song['trackTitle'])) {
                    $fileUrl = $song['file'] ?? '';
                    $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, es_sistema, id_usuario_subio, numero_pista) VALUES (?, ?, ?, 0, ?, ?)");
                    $stmt->execute([$song['trackTitle'], $idAlbum, $fileUrl, $user_id, $idx + 1]);
                }
            }
        }
    }

    sendJson(['success' => true]);
}

function deleteAlbum($pdo, $user_id, $data)
{
    $idAlbum = $data['id_album'] ?? 0;
    if (!$idAlbum) sendJson(['success' => false, 'message' => 'ID de álbum requerido']);
    $stmt = $pdo->prepare("SELECT es_sistema FROM albumes WHERE id_album = ?");
    $stmt->execute([$idAlbum]);
    if ($stmt->fetchColumn()) {
        sendJson(['success' => false, 'message' => 'No se pueden eliminar álbumes del sistema']);
    }
    $stmt = $pdo->prepare("DELETE FROM albumes WHERE id_album = ?");
    $stmt->execute([$idAlbum]);
    sendJson(['success' => true]);
}

function getUserProfile($pdo, $user_id)
{
    try {
        $stmt = $pdo->prepare("SELECT nombre_usuario, email, avatar FROM usuarios WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            sendJson(['success' => true, 'user' => $user]);
        } else {
            sendJson(['success' => false, 'message' => 'Usuario no encontrado']);
        }
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error en getUserProfile: ' . $e->getMessage()]);
    }
}

function updateUserProfile($pdo, $user_id, $data, $files)
{
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $avatarFile = $files['avatar'] ?? null;

    if (!$username || !$email) sendJson(['success' => false, 'message' => 'Nombre y email requeridos']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) sendJson(['success' => false, 'message' => 'Email inválido']);

    $updates = [];
    $params = [];
    $updates[] = "nombre_usuario = ?";
    $params[] = $username;
    $updates[] = "email = ?";
    $params[] = $email;

    if (!empty($password)) {
        $pattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/';
        if (!preg_match($pattern, $password)) sendJson(['success' => false, 'message' => 'Contraseña débil']);
        $updates[] = "password_hash = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }

    if ($avatarFile && $avatarFile['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/uploads/avatars/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($avatarFile['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
        $relativePath = 'uploads/avatars/' . $filename;
        if (move_uploaded_file($avatarFile['tmp_name'], $uploadDir . $filename)) {
            $updates[] = "avatar = ?";
            $params[] = $relativePath;
        }
    }

    $params[] = $user_id;
    $sql = "UPDATE usuarios SET " . implode(", ", $updates) . " WHERE id_usuario = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $_SESSION['user_name'] = $username;
    $_SESSION['user_email'] = $email;
    sendJson(['success' => true, 'user' => ['nombre_usuario' => $username, 'email' => $email]]);
}

function getUserStats($pdo, $user_id)
{
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM resenas WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $totalReviews = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM favoritos WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $totalFavorites = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM playlists WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $totalPlaylists = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM canciones WHERE es_sistema = 0 AND id_usuario_subio = ?");
        $stmt->execute([$user_id]);
        $totalImported = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT AVG(puntuacion) FROM resenas WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $avg = $stmt->fetchColumn();
        $avgRating = $avg !== null ? round((float)$avg, 1) : 0;

        sendJson([
            'success' => true,
            'total_reviews' => $totalReviews,
            'total_favorites' => $totalFavorites,
            'total_playlists' => $totalPlaylists,
            'total_imported' => $totalImported,
            'avg_rating' => $avgRating
        ]);
    } catch (Exception $e) {
        sendJson(['success' => false, 'message' => 'Error en getUserStats: ' . $e->getMessage()]);
    }
}

// ============================================================
// FUNCIONES SOCIALES
// ============================================================
function getPublicProfile($pdo, $current_user_id, $data)
{
    $target_user_id = $data['user_id'] ?? 0;
    if (!$target_user_id) {
        sendJson(['success' => false, 'message' => 'ID de usuario requerido']);
    }

    // Datos del usuario (sin email)
    $stmt = $pdo->prepare("SELECT id_usuario, nombre_usuario, avatar, fecha_registro FROM usuarios WHERE id_usuario = ?");
    $stmt->execute([$target_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendJson(['success' => false, 'message' => 'Usuario no encontrado']);
    }

    // Estadísticas
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM playlists WHERE id_usuario = ?");
    $stmt->execute([$target_user_id]);
    $total_playlists = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM resenas WHERE id_usuario = ?");
    $stmt->execute([$target_user_id]);
    $total_reviews = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM seguidores WHERE id_seguido = ?");
    $stmt->execute([$target_user_id]);
    $followers = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM seguidores WHERE id_usuario = ?");
    $stmt->execute([$target_user_id]);
    $following = (int)$stmt->fetchColumn();

    // Playlists públicas del usuario
    $stmt = $pdo->prepare("SELECT id_playlist, nombre, portada_url FROM playlists WHERE id_usuario = ?");
    $stmt->execute([$target_user_id]);
    $playlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Reseñas recientes
    $stmt = $pdo->prepare("
        SELECT r.puntuacion, r.comentario, r.fecha, 
               r.titulo_cancion_texto, r.artista_texto,
               COALESCE(a.caratula_url, '') as albumCover
        FROM resenas r
        LEFT JOIN canciones c ON r.id_cancion = c.id_cancion
        LEFT JOIN albumes a ON c.id_album = a.id_album
        WHERE r.id_usuario = ?
        ORDER BY r.fecha DESC
        LIMIT 5
    ");
    $stmt->execute([$target_user_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Verificar si el usuario actual sigue a este usuario
    $stmt = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario = ? AND id_seguido = ?");
    $stmt->execute([$current_user_id, $target_user_id]);
    $is_following = $stmt->fetchColumn() ? true : false;

    // Verificar si son amigos mutuos (ambos se siguen)
    $stmt = $pdo->prepare("
    SELECT 1 FROM seguidores s1
    JOIN seguidores s2 ON s1.id_usuario = s2.id_seguido AND s1.id_seguido = s2.id_usuario
    WHERE s1.id_usuario = ? AND s1.id_seguido = ?
");
    $stmt->execute([$current_user_id, $target_user_id]);
    $are_friends = $stmt->fetchColumn() ? true : false;
    sendJson([
        'success' => true,
        'user' => $user,
        'stats' => [
            'playlists' => $total_playlists,
            'reviews' => $total_reviews,
            'followers' => $followers,
            'following' => $following
        ],
        'playlists' => $playlists,
        'reviews' => $reviews,
        'is_following' => $is_following,
        'are_friends' => $are_friends
    ]);
}

function toggleFollowUser($pdo, $current_user_id, $data)
{
    $target_user_id = $data['user_id'] ?? 0;
    if (!$target_user_id) {
        sendJson(['success' => false, 'message' => 'ID de usuario requerido']);
    }
    if ($target_user_id == $current_user_id) {
        sendJson(['success' => false, 'message' => 'No puedes seguirte a ti mismo']);
    }

    $stmt = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario = ? AND id_seguido = ?");
    $stmt->execute([$current_user_id, $target_user_id]);
    $exists = $stmt->fetchColumn();

    if ($exists) {
        $stmt = $pdo->prepare("DELETE FROM seguidores WHERE id_usuario = ? AND id_seguido = ?");
        $stmt->execute([$current_user_id, $target_user_id]);
        $following = false;
    } else {
        $stmt = $pdo->prepare("INSERT INTO seguidores (id_usuario, id_seguido) VALUES (?, ?)");
        $stmt->execute([$current_user_id, $target_user_id]);
        $following = true;
        $nombre = obtenerNombreUsuario($pdo, $target_user_id);
        registrarActividad($pdo, $current_user_id, 'seguimiento', $target_user_id, "comenzó a seguir a $nombre");
    }

    sendJson(['success' => true, 'following' => $following]);
}

function getFollowers($pdo, $user_id, $data)
{
    $target_user_id = $data['user_id'] ?? $user_id;

    $stmt = $pdo->prepare("
        SELECT u.id_usuario, u.nombre_usuario, u.avatar, s.fecha_seguimiento
        FROM seguidores s
        JOIN usuarios u ON s.id_usuario = u.id_usuario
        WHERE s.id_seguido = ?
        ORDER BY s.fecha_seguimiento DESC
    ");
    $stmt->execute([$target_user_id]);
    $followers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJson(['success' => true, 'followers' => $followers]);
}

function getFollowing($pdo, $user_id, $data)
{
    $target_user_id = $data['user_id'] ?? $user_id;

    $stmt = $pdo->prepare("
        SELECT u.id_usuario, u.nombre_usuario, u.avatar, s.fecha_seguimiento
        FROM seguidores s
        JOIN usuarios u ON s.id_seguido = u.id_usuario
        WHERE s.id_usuario = ?
        ORDER BY s.fecha_seguimiento DESC
    ");
    $stmt->execute([$target_user_id]);
    $following = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJson(['success' => true, 'following' => $following]);
}

function getFeed($pdo, $user_id, $data)
{
    try {
        $limit = isset($data['limit']) ? (int)$data['limit'] : 20;
        $offset = isset($data['offset']) ? (int)$data['offset'] : 0;
        $filter = isset($data['filter']) ? $data['filter'] : 'all';

        $stmt = $pdo->prepare("SELECT id_seguido FROM seguidores WHERE id_usuario = ?");
        $stmt->execute([$user_id]);
        $following_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $following_ids[] = $user_id;

        if (empty($following_ids)) {
            sendJson(['success' => true, 'feed' => [], 'total' => 0]);
            return;
        }

        $placeholders = implode(',', array_fill(0, count($following_ids), '?'));

        $sql = "
            SELECT a.*, u.nombre_usuario, u.avatar
            FROM actividad_social a
            JOIN usuarios u ON a.id_usuario = u.id_usuario
            WHERE a.id_usuario IN ($placeholders)
        ";

        if ($filter !== 'all') {
            $sql .= " AND a.tipo_actividad = ?";
        }

        $sql .= " ORDER BY a.fecha DESC LIMIT ? OFFSET ?";

        $stmt = $pdo->prepare($sql);
        $idx = 1;
        foreach ($following_ids as $id) {
            $stmt->bindValue($idx++, $id, PDO::PARAM_INT);
        }
        if ($filter !== 'all') {
            $stmt->bindValue($idx++, $filter, PDO::PARAM_STR);
        }
        $stmt->bindValue($idx++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($idx++, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $feed = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Total
        $sqlTotal = "SELECT COUNT(*) FROM actividad_social WHERE id_usuario IN ($placeholders)";
        if ($filter !== 'all') {
            $sqlTotal .= " AND tipo_actividad = ?";
        }
        $stmtTotal = $pdo->prepare($sqlTotal);
        $paramsTotal = $following_ids;
        if ($filter !== 'all') {
            $paramsTotal[] = $filter;
        }
        $stmtTotal->execute($paramsTotal);
        $total = $stmtTotal->fetchColumn();

        sendJson(['success' => true, 'feed' => $feed, 'total' => (int)$total]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Base table or view not found') !== false) {
            sendJson(['success' => true, 'feed' => [], 'total' => 0]);
        } else {
            sendJson(['success' => false, 'message' => 'Error al cargar el feed: ' . $e->getMessage()]);
        }
    }
}

function exploreUsers($pdo, $user_id, $data)
{
    try {
        $search = isset($data['search']) ? '%' . $data['search'] . '%' : '%';
        $limit = isset($data['limit']) ? (int)$data['limit'] : 20;
        $offset = isset($data['offset']) ? (int)$data['offset'] : 0;
        $filter = isset($data['filter']) ? $data['filter'] : 'all';

        $orderBy = "followers_count DESC, nombre_usuario";
        if ($filter === 'recent') {
            $orderBy = "fecha_registro DESC";
        }

        $sql = "
            SELECT u.id_usuario, u.nombre_usuario, u.avatar, u.fecha_registro,
                (SELECT COUNT(*) FROM seguidores WHERE id_seguido = u.id_usuario) as followers_count,
                (SELECT COUNT(*) FROM seguidores WHERE id_usuario = u.id_usuario) as following_count
            FROM usuarios u
            WHERE u.id_usuario != ? AND u.nombre_usuario LIKE ?
            ORDER BY $orderBy
            LIMIT ? OFFSET ?
        ";

        $stmt = $pdo->prepare($sql);

        // ✅ Enlazar parámetros con tipos explícitos
        $stmt->bindValue(1, $user_id, PDO::PARAM_INT);
        $stmt->bindValue(2, $search, PDO::PARAM_STR);
        $stmt->bindValue(3, $limit, PDO::PARAM_INT);
        $stmt->bindValue(4, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$user) {
            $stmt = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario = ? AND id_seguido = ?");
            $stmt->execute([$user_id, $user['id_usuario']]);
            $user['is_following'] = $stmt->fetchColumn() ? true : false;
        }

        $sqlTotal = "SELECT COUNT(*) FROM usuarios WHERE id_usuario != ? AND nombre_usuario LIKE ?";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute([$user_id, $search]);
        $total = $stmtTotal->fetchColumn();

        sendJson(['success' => true, 'users' => $users, 'total' => (int)$total]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Base table or view not found') !== false) {
            sendJson(['success' => true, 'users' => [], 'total' => 0]);
        } else {
            sendJson(['success' => false, 'message' => 'Error en exploreUsers: ' . $e->getMessage()]);
        }
    }
}

function addPlaylistToLibrary($pdo, $user_id, $data)
{
    $playlist_id = $data['playlist_id'] ?? 0;
    if (!$playlist_id) {
        sendJson(['success' => false, 'message' => 'ID de playlist requerido']);
    }

    $stmt = $pdo->prepare("SELECT nombre, portada_url, id_usuario FROM playlists WHERE id_playlist = ?");
    $stmt->execute([$playlist_id]);
    $playlist = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$playlist) {
        sendJson(['success' => false, 'message' => 'Playlist no encontrada']);
    }
    if ($playlist['id_usuario'] == $user_id) {
        sendJson(['success' => false, 'message' => 'Esta playlist es tuya, no puedes copiarla a ti mismo']);
    }

    // Verificar si ya existe una copia en la biblioteca del usuario
    $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE id_usuario = ? AND nombre = ?");
    $stmt->execute([$user_id, $playlist['nombre'] . ' (copia)']);
    if ($stmt->fetchColumn()) {
        sendJson(['success' => false, 'message' => 'Ya tienes una copia de esta playlist en tu biblioteca']);
    }

    $nuevo_nombre = $playlist['nombre'] . ' (copia)';
    $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url) VALUES (?, ?, ?)");
    $stmt->execute([$nuevo_nombre, $user_id, $playlist['portada_url']]);
    $nuevo_id = $pdo->lastInsertId();

    $stmt = $pdo->prepare("SELECT id_cancion FROM playlist_canciones WHERE id_playlist = ? ORDER BY orden");
    $stmt->execute([$playlist_id]);
    $canciones = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($canciones as $idx => $id_cancion) {
        $stmt = $pdo->prepare("INSERT INTO playlist_canciones (id_playlist, id_cancion, orden) VALUES (?, ?, ?)");
        $stmt->execute([$nuevo_id, $id_cancion, $idx]);
    }

    registrarActividad($pdo, $user_id, 'playlist_creada', $nuevo_id, "añadió la playlist '{$playlist['nombre']}' a su biblioteca");

    sendJson(['success' => true, 'id_playlist' => $nuevo_id, 'nombre' => $nuevo_nombre]);
}

function mergePlaylists($pdo, $user_id, $data)
{
    $friend_id = $data['friend_id'] ?? 0;
    if (!$friend_id) {
        sendJson(['success' => false, 'message' => 'ID de amigo requerido']);
    }

    // Verificar que son amigos mutuos
    $stmt = $pdo->prepare("
        SELECT 1 FROM seguidores s1
        JOIN seguidores s2 ON s1.id_usuario = s2.id_seguido AND s1.id_seguido = s2.id_usuario
        WHERE s1.id_usuario = ? AND s1.id_seguido = ?
    ");
    $stmt->execute([$user_id, $friend_id]);
    if (!$stmt->fetchColumn()) {
        sendJson(['success' => false, 'message' => 'Debes ser amigo de este usuario para fusionar playlists']);
    }

    // Obtener nombres
    $stmt = $pdo->prepare("SELECT nombre_usuario FROM usuarios WHERE id_usuario = ?");
    $stmt->execute([$user_id]);
    $mi_nombre = $stmt->fetchColumn();
    $stmt->execute([$friend_id]);
    $friend_name = $stmt->fetchColumn();

    $nombre_playlist = "Fusión: " . $mi_nombre . " + " . $friend_name;

    // Verificar si el usuario actual YA TIENE la playlist fusionada
    $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE id_usuario = ? AND nombre = ?");
    $stmt->execute([$user_id, $nombre_playlist]);
    if ($stmt->fetchColumn()) {
        sendJson(['success' => false, 'message' => 'Ya tienes esta playlist fusionada en tu biblioteca.']);
    }

    // Verificar si el AMIGO ya tiene la playlist fusionada
    $stmt = $pdo->prepare("SELECT id_playlist, portada_url FROM playlists WHERE id_usuario = ? AND nombre = ?");
    $stmt->execute([$friend_id, $nombre_playlist]);
    $friend_playlist = $stmt->fetch(PDO::FETCH_ASSOC);

    // Si el amigo ya la tiene, copiamos su playlist al usuario actual
    if ($friend_playlist) {
        // Copiar la playlist del amigo
        $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url) VALUES (?, ?, ?)");
        $stmt->execute([$nombre_playlist, $user_id, $friend_playlist['portada_url']]);
        $nuevo_id_user = $pdo->lastInsertId();

        // Copiar canciones de la playlist del amigo
        $stmt = $pdo->prepare("SELECT id_cancion, orden FROM playlist_canciones WHERE id_playlist = ? ORDER BY orden");
        $stmt->execute([$friend_playlist['id_playlist']]);
        $canciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($canciones as $c) {
            $stmt = $pdo->prepare("INSERT INTO playlist_canciones (id_playlist, id_cancion, orden) VALUES (?, ?, ?)");
            $stmt->execute([$nuevo_id_user, $c['id_cancion'], $c['orden']]);
        }

        registrarActividad($pdo, $user_id, 'playlist_creada', $nuevo_id_user, "obtuvo una copia de la playlist fusionada '$nombre_playlist' con $friend_name");

        sendJson([
            'success' => true,
            'id_playlist' => $nuevo_id_user,
            'nombre' => $nombre_playlist,
            'total_canciones' => count($canciones),
            'copied_from_friend' => true // Indicador para el frontend
        ]);
        return;
    }

    // ============================================================
    // NINGUNO TIENE LA PLAYLIST → CREAR NUEVA PARA AMBOS
    // ============================================================

    // Obtener canciones del usuario
    $stmt = $pdo->prepare("
        SELECT DISTINCT c.id_cancion, c.titulo, c.genero, COALESCE(ar.nombre_artista, '') as artista
        FROM canciones c
        LEFT JOIN albumes a ON c.id_album = a.id_album
        LEFT JOIN artistas ar ON a.id_artista = ar.id_artista
        WHERE c.es_sistema = 1 OR c.id_usuario_subio = ? OR a.id_usuario = ?
    ");
    $stmt->execute([$user_id, $user_id]);
    $mis_canciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener canciones del amigo
    $stmt = $pdo->prepare("
        SELECT DISTINCT c.id_cancion, c.titulo, c.genero, COALESCE(ar.nombre_artista, '') as artista
        FROM canciones c
        LEFT JOIN albumes a ON c.id_album = a.id_album
        LEFT JOIN artistas ar ON a.id_artista = ar.id_artista
        WHERE c.es_sistema = 1 OR c.id_usuario_subio = ? OR a.id_usuario = ?
    ");
    $stmt->execute([$friend_id, $friend_id]);
    $amigo_canciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mis_ids = array_column($mis_canciones, 'id_cancion');
    $amigo_ids = array_column($amigo_canciones, 'id_cancion');
    $comunes = array_intersect($mis_ids, $amigo_ids);

    // Crear playlist fusionada para ambos usuarios
    $portada = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400';

    // Insertar en el usuario actual
    $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url) VALUES (?, ?, ?)");
    $stmt->execute([$nombre_playlist, $user_id, $portada]);
    $nuevo_id_user = $pdo->lastInsertId();

    // Insertar en el amigo
    $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url) VALUES (?, ?, ?)");
    $stmt->execute([$nombre_playlist, $friend_id, $portada]);
    $nuevo_id_friend = $pdo->lastInsertId();

    // Seleccionar canciones según algoritmo
    $total_canciones_seleccionadas = [];
    $idx = 0;

    // 1. 40% canciones en común
    $comunes_list = array_values($comunes);
    shuffle($comunes_list);
    $limite_comunes = min(count($comunes_list), ceil(30 * 0.4));
    for ($i = 0; $i < $limite_comunes; $i++) {
        $total_canciones_seleccionadas[] = $comunes_list[$i];
    }

    // 2. 30% del género más escuchado
    $generos = array_merge(
        array_column($mis_canciones, 'genero'),
        array_column($amigo_canciones, 'genero')
    );
    $generos = array_filter($generos);
    $genero_top = '';
    if (!empty($generos)) {
        $genero_count = array_count_values($generos);
        arsort($genero_count);
        $genero_top = key($genero_count);
        $candidatas = [];
        foreach ($mis_canciones as $c) {
            if ($c['genero'] === $genero_top && !in_array($c['id_cancion'], $total_canciones_seleccionadas)) {
                $candidatas[] = $c['id_cancion'];
            }
        }
        shuffle($candidatas);
        $limite_genero = min(count($candidatas), ceil(30 * 0.3));
        for ($i = 0; $i < $limite_genero; $i++) {
            $total_canciones_seleccionadas[] = $candidatas[$i];
        }
    }

    // 3. 20% mejor calificadas
    $canciones_candidatas = array_merge($mis_ids, $amigo_ids);
    $canciones_candidatas = array_unique($canciones_candidatas);
    $canciones_candidatas = array_diff($canciones_candidatas, $total_canciones_seleccionadas);
    $canciones_con_rating = [];
    foreach ($canciones_candidatas as $id) {
        $stmt = $pdo->prepare("SELECT AVG(puntuacion) as rating FROM resenas WHERE id_cancion = ?");
        $stmt->execute([$id]);
        $rating = $stmt->fetchColumn();
        if ($rating && $rating >= 4) {
            $canciones_con_rating[] = ['id' => $id, 'rating' => $rating];
        }
    }
    usort($canciones_con_rating, function ($a, $b) {
        return $b['rating'] <=> $a['rating'];
    });
    $limite_rating = min(count($canciones_con_rating), ceil(30 * 0.2));
    for ($i = 0; $i < $limite_rating; $i++) {
        $total_canciones_seleccionadas[] = $canciones_con_rating[$i]['id'];
    }

    // 4. 10% aleatorias
    $restantes = array_diff($canciones_candidatas, $total_canciones_seleccionadas);
    shuffle($restantes);
    $limite_aleatorio = min(count($restantes), ceil(30 * 0.1));
    for ($i = 0; $i < $limite_aleatorio; $i++) {
        $total_canciones_seleccionadas[] = $restantes[$i];
    }

    // Si no hay suficientes canciones, rellenar
    if (count($total_canciones_seleccionadas) < 5) {
        $faltantes = array_diff($canciones_candidatas, $total_canciones_seleccionadas);
        shuffle($faltantes);
        $total_canciones_seleccionadas = array_merge($total_canciones_seleccionadas, array_slice($faltantes, 0, 5 - count($total_canciones_seleccionadas)));
    }

    // Insertar canciones en ambas playlists
    foreach ($total_canciones_seleccionadas as $idx => $id_cancion) {
        $stmt = $pdo->prepare("INSERT INTO playlist_canciones (id_playlist, id_cancion, orden) VALUES (?, ?, ?)");
        $stmt->execute([$nuevo_id_user, $id_cancion, $idx]);
        $stmt->execute([$nuevo_id_friend, $id_cancion, $idx]);
    }

    // Registrar actividad
    registrarActividad($pdo, $user_id, 'playlist_creada', $nuevo_id_user, "creó la playlist fusionada '$nombre_playlist' con $friend_name");
    registrarActividad($pdo, $friend_id, 'playlist_creada', $nuevo_id_friend, "creó la playlist fusionada '$nombre_playlist' con $mi_nombre");

    sendJson([
        'success' => true,
        'id_playlist' => $nuevo_id_user,
        'nombre' => $nombre_playlist,
        'total_canciones' => count($total_canciones_seleccionadas),
        'copied_from_friend' => false
    ]);
}

function checkFriends($pdo, $user_id, $data)
{
    $target_user_id = $data['user_id'] ?? 0;
    if (!$target_user_id) {
        sendJson(['success' => false, 'message' => 'ID de usuario requerido']);
    }

    $stmt = $pdo->prepare("
        SELECT 1 FROM seguidores s1
        JOIN seguidores s2 ON s1.id_usuario = s2.id_seguido AND s1.id_seguido = s2.id_usuario
        WHERE s1.id_usuario = ? AND s1.id_seguido = ?
    ");
    $stmt->execute([$user_id, $target_user_id]);
    $are_friends = $stmt->fetchColumn() ? true : false;

    sendJson(['success' => true, 'are_friends' => $are_friends]);
}

function isFollowing($pdo, $user_id, $data)
{
    $target_user_id = $data['user_id'] ?? 0;
    if (!$target_user_id) {
        sendJson(['success' => false, 'message' => 'ID de usuario requerido']);
    }

    $stmt = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario = ? AND id_seguido = ?");
    $stmt->execute([$user_id, $target_user_id]);
    $is_following = $stmt->fetchColumn() ? true : false;

    sendJson(['success' => true, 'is_following' => $is_following]);
}

// ============================================================
// FUNCIONES AUXILIARES SOCIALES
// ============================================================

function obtenerNombreUsuario($pdo, $user_id)
{
    $stmt = $pdo->prepare("SELECT nombre_usuario FROM usuarios WHERE id_usuario = ?");
    $stmt->execute([$user_id]);
    return $stmt->fetchColumn() ?: 'Usuario';
}

function registrarActividad($pdo, $user_id, $tipo, $id_referencia, $descripcion)
{
    $stmt = $pdo->prepare("INSERT INTO actividad_social (id_usuario, tipo_actividad, id_referencia, descripcion) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $tipo, $id_referencia, $descripcion]);
}

function checkMergedPlaylist($pdo, $user_id, $data)
{
    $friend_id = $data['friend_id'] ?? 0;
    if (!$friend_id) {
        sendJson(['success' => false, 'message' => 'ID de amigo requerido']);
    }

    // Obtener nombres
    $stmt = $pdo->prepare("SELECT nombre_usuario FROM usuarios WHERE id_usuario = ?");
    $stmt->execute([$user_id]);
    $mi_nombre = $stmt->fetchColumn();
    $stmt->execute([$friend_id]);
    $friend_name = $stmt->fetchColumn();

    $nombre_playlist = "Fusión: " . $mi_nombre . " + " . $friend_name;

    $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE id_usuario = ? AND nombre = ?");
    $stmt->execute([$user_id, $nombre_playlist]);
    $exists = $stmt->fetchColumn() ? true : false;

    sendJson(['success' => true, 'exists' => $exists]);
}
