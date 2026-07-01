<?php
// scripts/seed_metadata.php
// Pobla la base de datos con álbumes, canciones reales y metadatos completos
// (duración, imagen del artista, etc.)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Database.php';

$db = new Database();
$pdo = $db->getConnection();

// ============================================================
// CONFIGURACIÓN DE ARTISTAS Y CANCIONES FAMOSAS
// ============================================================
$ARTISTS = [
    'Queen',
    'The Beatles',
    'Michael Jackson',
    "Guns N' Roses",
    'Radiohead',
    'Pink Floyd',
    'The Rolling Stones',
    'David Bowie',
    'Fleetwood Mac',
    'U2',
    'Led Zeppelin',
    'The Who',
    'The Doors',
    'The Beach Boys',
    'Nirvana',
    'Evanescence',
    'AC/DC',
    'The Smiths',
    'System Of A Down',
    'King Crimson',
    'Eminem',
    'Canserbero',
    'The Police',
    'Deftones',
    'Gorillaz',
    'Linkin Park',
    'The Killers',
    'Metallica',
    'Wings',
    'Limp Bizkit',
    'Lady Gaga',
    'Britney Spears',
    'Green Day',
    'Mac Miller',
    'Imagine Dragons',
    'Mac DeMarco'
];

$FAMOUS_SONGS = [
    'Queen' => ['Bohemian Rhapsody', 'We Will Rock You', 'We Are The Champions', 'Another One Bites The Dust', 'Radio Ga Ga', 'Somebody To Love'],
    'The Beatles' => ['Hey Jude', 'Let It Be', 'Yesterday', 'Come Together', 'Something', 'Help!'],
    'Michael Jackson' => ['Billie Jean', 'Thriller', 'Beat It', 'Bad', 'Smooth Criminal', 'Black or White'],
    "Guns N' Roses" => ['Sweet Child O Mine', 'November Rain', 'Welcome To The Jungle', 'Paradise City', 'Knockin On Heavens Door', 'Patience', "Don't Cry"],
    'Radiohead' => ['Creep', 'Karma Police', 'No Surprises', 'High And Dry', 'Fake Plastic Trees', 'Paranoid Android'],
    'Pink Floyd' => ['Another Brick In The Wall', 'Wish You Were Here', 'Comfortably Numb', 'Money', 'Time', 'Shine On You Crazy Diamond'],
    'The Rolling Stones' => ['Paint It Black', 'Angie', 'Sympathy For The Devil', 'Gimme Shelter', 'Start Me Up', 'Brown Sugar'],
    'David Bowie' => ['Heroes', 'Space Oddity', 'Life On Mars', 'Starman', 'Changes', 'Under Pressure'],
    'Fleetwood Mac' => ['Dreams', 'Go Your Own Way', 'The Chain', 'Rhiannon', 'Landslide', 'Don\'t Stop'],
    'U2' => ['With Or Without You', 'Beautiful Day', 'One', 'Where The Streets Have No Name', 'Sunday Bloody Sunday', 'I Still Havent Found What Im Looking For'],
    'Led Zeppelin' => ['Stairway To Heaven', 'Whole Lotta Love', 'Kashmir', 'Immigrant Song', 'Rock And Roll', 'Black Dog'],
    'The Who' => ['Baba O Riley', 'Pinball Wizard', 'My Generation', 'Wont Get Fooled Again', 'Behind Blue Eyes', 'Who Are You'],
    'The Doors' => ['Riders On The Storm', 'Light My Fire', 'Break On Through', 'The End', 'People Are Strange', 'L.A. Woman'],
    'The Beach Boys' => ['Good Vibrations', 'God Only Knows', 'Wouldn\'t It Be Nice', 'Kokomo', 'Surfin\' USA', 'California Girls'],
    'Nirvana' => ['Smells Like Teen Spirit', 'Come As You Are', 'Lithium', 'In Bloom', 'Heart-Shaped Box', 'About A Girl'],
    'Evanescence' => ['Bring Me To Life', 'My Immortal', 'Going Under', 'Everybody\'s Fool', 'Call Me When You\'re Sober', 'Lithium'],
    'AC/DC' => ['Back In Black', 'Highway To Hell', 'Thunderstruck', 'You Shook Me All Night Long', 'Dirty Deeds Done Dirt Cheap', 'Hells Bells'],
    'The Smiths' => ['This Charming Man', 'How Soon Is Now', 'There Is A Light That Never Goes Out', 'Heaven Knows Im Miserable Now', 'Panic', 'Girlfriend In A Coma'],
    'System Of A Down' => ['Chop Suey', 'Toxicity', 'Aerials', 'B.Y.O.B.', 'Hypnotize', 'Lonely Day'],
    'King Crimson' => ['21st Century Schizoid Man', 'The Court Of The Crimson King', 'Epitaph', 'Red', 'Starless', 'In The Wake Of Poseidon'],
    'Eminem' => ['Lose Yourself', 'Stan', 'Without Me', 'The Real Slim Shady', 'Love The Way You Lie', 'Not Afraid'],
    'Canserbero' => ['Mundo', 'Eres', 'C\'est La Mort', 'Maquiavélico', 'Dejame', 'Perdón', 'Stupid Love Story'], // AÑADIDA
    'The Police' => ['Every Breath You Take', 'Roxanne', 'Message In A Bottle', 'Don\'t Stand So Close To Me', 'Every Little Thing She Does Is Magic', 'Walking On The Moon'],
    'Deftones' => ['Change', 'My Own Summer', 'Bored', 'Be Quiet And Drive', 'Passenger', 'Diamond Eyes'],
    'Gorillaz' => ['Feel Good Inc.', 'Clint Eastwood', 'Dare', 'On Melancholy Hill', 'Stylo', 'Rhinestone Eyes'],
    'Linkin Park' => ['In The End', 'Numb', 'Crawling', 'Faint', 'Somewhere I Belong', 'What I\'ve Done'],
    'The Killers' => ['Mr. Brightside', 'Somebody Told Me', 'When You Were Young', 'Read My Mind', 'Human', 'Smile Like You Mean It'],
    'Metallica' => ['Enter Sandman', 'Nothing Else Matters', 'Master Of Puppets', 'One', 'The Unforgiven', 'Fade To Black'],
    'Wings' => ['Mull Of Kintyre', 'Jet', 'Band On The Run', 'Live And Let Die', 'My Love', 'Silly Love Songs'],
    'Limp Bizkit' => ['Nookie', 'Break Stuff', 'Rollin', 'My Way', 'Behind Blue Eyes', 'Take A Look Around'],
    'Lady Gaga' => ['Bad Romance', 'Poker Face', 'Born This Way', 'Shallow', 'Alejandro', 'Paparazzi'],
    'Britney Spears' => ['Baby One More Time', 'Toxic', 'Oops!... I Did It Again', 'Womanizer', 'Circus', 'Gimme More'],
    'Green Day' => ['Boulevard of Broken Dreams', 'American Idiot', 'Wake Me Up When September Ends', '21 Guns', 'Good Riddance (Time of Your Life)', 'Holiday'],
    'Mac Miller' => ['Self Care', 'Dang!', 'What\'s the Use?', 'The Spins', 'Small Worlds', 'Good News'],
    'Imagine Dragons' => ['Believer', 'Radioactive', 'Thunder', 'Demons', 'Whatever It Takes', 'Enemy'],
    'Mac DeMarco' => ['My Kind of Woman', 'Chamber of Reflection', 'Salad Days', 'Ode to Viceroy', 'Heart to Heart', 'Freaking Out the Neighborhood']
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

// Normaliza cadenas (minúsculas, sin acentos, sin comillas, conserva espacios)
function cleanString($string)
{
    $string = mb_strtolower(trim($string), 'UTF-8');
    $replace = [
        'á' => 'a',
        'é' => 'e',
        'í' => 'i',
        'ó' => 'o',
        'ú' => 'u',
        'à' => 'a',
        'è' => 'e',
        'ì' => 'i',
        'ò' => 'o',
        'ù' => 'u',
        'ñ' => 'n',
        'ü' => 'u',
        'ç' => 'c'
    ];
    $string = strtr($string, $replace);
    $string = preg_replace('/[^a-z0-9\s]/', '', $string);
    $string = preg_replace('/\s+/', ' ', $string);
    return trim($string);
}

// Obtiene información completa del artista (incluyendo imagen)
function getArtistInfo($artist)
{
    $url = "https://www.theaudiodb.com/api/v1/json/2/search.php?s=" . urlencode($artist);
    $response = @file_get_contents($url);
    if ($response === false) return null;
    $data = json_decode($response, true);
    if (isset($data['artists'][0])) {
        return $data['artists'][0];
    }
    return null;
}

function getAlbumsFromTheAudioDB($artist)
{
    $url = "https://www.theaudiodb.com/api/v1/json/2/searchalbum.php?s=" . urlencode($artist);
    $response = @file_get_contents($url);
    if ($response === false) return [];
    $data = json_decode($response, true);
    return $data['album'] ?? [];
}

function getTracksByAlbumId($idAlbum)
{
    $url = "https://www.theaudiodb.com/api/v1/json/2/track.php?m=" . urlencode($idAlbum);
    $response = @file_get_contents($url);
    if ($response === false) return [];
    $data = json_decode($response, true);
    return $data['track'] ?? [];
}

// Convierte "3:45" a segundos (345)
function durationToSeconds($duration)
{
    if (empty($duration)) return 0;
    $parts = explode(':', $duration);
    if (count($parts) === 2) {
        return (int)$parts[0] * 60 + (int)$parts[1];
    }
    return (int)$duration;
}

function getOrCreateArtist($pdo, $artistName, $artistInfo = null)
{
    $stmt = $pdo->prepare("SELECT id_artista FROM artistas WHERE nombre_artista = ?");
    $stmt->execute([$artistName]);
    $id = $stmt->fetchColumn();
    if ($id) {
        // Actualizar imagen si no tiene y hay información nueva
        if ($artistInfo && isset($artistInfo['strArtistThumb'])) {
            $stmt = $pdo->prepare("UPDATE artistas SET imagen_url = ? WHERE id_artista = ? AND (imagen_url IS NULL OR imagen_url = '')");
            $stmt->execute([$artistInfo['strArtistThumb'], $id]);
        }
        return $id;
    }

    $stmt = $pdo->prepare("INSERT INTO artistas (nombre_artista, imagen_url) VALUES (?, ?)");
    $imagen = $artistInfo['strArtistThumb'] ?? null;
    $stmt->execute([$artistName, $imagen]);
    return $pdo->lastInsertId();
}

function getOrCreateFavoritesPlaylist($pdo)
{
    $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE nombre = 'Mis Favoritas' LIMIT 1");
    $stmt->execute();
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $stmt = $pdo->prepare("INSERT INTO playlists (nombre, descripcion) VALUES ('Mis Favoritas', 'Tus canciones preferidas listas para escuchar')");
    $stmt->execute();
    return $pdo->lastInsertId();
}

// ============================================================
// PROCESO PRINCIPAL
// ============================================================
echo "🚀 Iniciando seeding con metadatos enriquecidos (duración e imagen de artista)...\n";

$playlistFavoritosId = getOrCreateFavoritesPlaylist($pdo);

$total = count($ARTISTS);
$actual = 0;

foreach ($ARTISTS as $artistName) {
    $actual++;
    $porcentaje = round(($actual / $total) * 100);
    echo "\n📌 [$porcentaje%] Procesando artista: $artistName\n";

    // Obtener información del artista (incluye imagen)
    $artistInfo = getArtistInfo($artistName);
    $artistId = getOrCreateArtist($pdo, $artistName, $artistInfo);

    if ($artistInfo && isset($artistInfo['strArtistThumb'])) {
        echo "  🖼️ Imagen del artista obtenida\n";
    } else {
        echo "  ⚠️ No se encontró imagen para $artistName\n";
    }

    $albums = getAlbumsFromTheAudioDB($artistName);

    if (empty($albums)) {
        echo "  ⚠️ No se encontraron álbumes para $artistName. Creando álbum genérico...\n";
        $albumTitle = substr($artistName . " - Greatest Hits", 0, 100);
        $cover = "https://picsum.photos/seed/" . md5($albumTitle) . "/300/300";
        $stmt = $pdo->prepare("INSERT INTO albumes (titulo, id_artista, anio, caratula_url, genero, es_sistema, es_publico) VALUES (?, ?, ?, ?, ?, 1, 1)");
        $stmt->execute([$albumTitle, $artistId, null, $cover, 'Various']);
        $albumId = $pdo->lastInsertId();
        echo "  📀 Álbum genérico creado: $albumTitle\n";

        // Insertar canciones famosas en el álbum genérico
        if (isset($FAMOUS_SONGS[$artistName])) {
            foreach ($FAMOUS_SONGS[$artistName] as $idx => $songName) {
                $songName = substr($songName, 0, 100);
                $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, numero_pista, genero, duracion_segundos, es_sistema) VALUES (?, ?, ?, ?, ?, ?, 1)");
                $stmt->execute([$songName, $albumId, null, $idx + 1, 'Various', 0]);
                echo "    🎵 $songName\n";
            }
        }
        continue;
    }

    $albumCount = 0;
    $artistFavoritesClean = [];
    if (isset($FAMOUS_SONGS[$artistName])) {
        foreach ($FAMOUS_SONGS[$artistName] as $favSong) {
            $artistFavoritesClean[cleanString($favSong)] = $favSong;
        }
    }

    foreach ($albums as $albumData) {
        if ($albumCount >= 3) break;

        $idAlbumAPI = $albumData['idAlbum'] ?? null;
        $albumTitle = substr($albumData['strAlbum'] ?? 'Álbum sin título', 0, 100);
        $year = $albumData['intYearReleased'] ?? null;
        $cover = $albumData['strAlbumThumb'] ?? 'https://picsum.photos/seed/' . md5($albumTitle) . '/300/300';
        $genre = $albumData['strGenre'] ?? 'Desconocido';

        if (!$idAlbumAPI) continue;

        echo "  📀 Álbum: $albumTitle\n";

        $stmt = $pdo->prepare("INSERT INTO albumes (titulo, id_artista, anio, caratula_url, genero, es_sistema, es_publico) VALUES (?, ?, ?, ?, ?, 1, 1)");
        $stmt->execute([$albumTitle, $artistId, $year, $cover, $genre]);
        $albumId = $pdo->lastInsertId();

        $apiTracks = getTracksByAlbumId($idAlbumAPI);

        if (!empty($apiTracks)) {
            foreach ($apiTracks as $trackData) {
                $trackName = substr($trackData['strTrack'] ?? 'Canción sin título', 0, 100);
                $trackNumber = $trackData['intTrackNumber'] ?? 1;
                $duration = durationToSeconds($trackData['strDuration'] ?? '0');
                if (!$trackName) continue;

                $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, numero_pista, genero, duracion_segundos, es_sistema) VALUES (?, ?, ?, ?, ?, ?, 1)");
                $stmt->execute([$trackName, $albumId, null, $trackNumber, $genre, $duration]);
                $songId = $pdo->lastInsertId();

                $clean = cleanString($trackName);
                if (isset($artistFavoritesClean[$clean])) {
                    echo "    ⭐️ $trackName (favorita) -> añadida a playlist\n";
                    $stmtPlaylist = $pdo->prepare("INSERT IGNORE INTO playlist_canciones (id_playlist, id_cancion) VALUES (?, ?)");
                    $stmtPlaylist->execute([$playlistFavoritosId, $songId]);
                    unset($artistFavoritesClean[$clean]);
                } else {
                    echo "    🎵 $trackName (" . ($duration ?: '?') . "s)\n";
                }
            }
        } else {
            echo "    ⚠️ No se encontraron canciones en la API para este álbum.\n";
        }

        $albumCount++;
    }

    // Insertar canciones famosas que faltan
    if (!empty($artistFavoritesClean)) {
        echo "  📌 Insertando canciones famosas faltantes...\n";
        $albumTitle = substr($artistName . " - Favoritas", 0, 100);
        $cover = "https://picsum.photos/seed/" . md5($albumTitle) . "/300/300";
        $stmt = $pdo->prepare("INSERT INTO albumes (titulo, id_artista, anio, caratula_url, genero, es_sistema, es_publico) VALUES (?, ?, ?, ?, ?, 1, 1)");
        $stmt->execute([$albumTitle, $artistId, null, $cover, 'Pop/Rock']);
        $albumId = $pdo->lastInsertId();

        foreach ($artistFavoritesClean as $clean => $songName) {
            $songName = substr($songName, 0, 100);
            $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, numero_pista, genero, duracion_segundos, es_sistema) VALUES (?, ?, ?, ?, ?, ?, 1)");
            $stmt->execute([$songName, $albumId, null, 1, 'Pop/Rock', 0]);
            $songId = $pdo->lastInsertId();
            $stmtPlaylist = $pdo->prepare("INSERT IGNORE INTO playlist_canciones (id_playlist, id_cancion) VALUES (?, ?)");
            $stmtPlaylist->execute([$playlistFavoritosId, $songId]);
            echo "    ⭐️ $songName (faltante, añadida como favorita)\n";
        }
    }

    usleep(150000);
}

echo "\n🎉 ¡Seeding completado con metadatos enriquecidos!\n";
echo "📊 Resumen:\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM artistas");
echo "  • Artistas: " . $stmt->fetchColumn() . "\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM albumes WHERE es_sistema = 1");
echo "  • Álbumes del sistema: " . $stmt->fetchColumn() . "\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM canciones WHERE es_sistema = 1");
echo "  • Canciones del sistema: " . $stmt->fetchColumn() . "\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM canciones WHERE es_sistema = 1 AND duracion_segundos > 0");
echo "  • Canciones con duración: " . $stmt->fetchColumn() . "\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM artistas WHERE imagen_url IS NOT NULL AND imagen_url != ''");
echo "  • Artistas con imagen: " . $stmt->fetchColumn() . "\n";
