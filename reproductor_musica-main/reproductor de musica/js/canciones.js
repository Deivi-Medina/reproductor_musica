// --- BASE DE DATOS DE ÁLBUMES Y CANCIONES (RUTAS CORREGIDAS PARA EL NAVEGADOR) ---

const albums = [
    { 
        title: "A Hard Day's Night", 
        artist: "The Beatles", 
        cover: "https://i.ytimg.com/vi/5en2JMLA8Z0/maxresdefault.jpg",
        songs: [
            // Las rutas parten desde index.html, por lo que entran directo a "audios/"
            { trackTitle: "And I Love Her", file: "audios/AHDN/AndILoveHer.mp3" },
            { trackTitle: "If I Fell", file: "audios/AHDN/IfIFell.mp3" } 
        ]
    },
    { 
        title: "The Dark Side of the Moon", 
        artist: "Pink Floyd", 
        cover: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
        songs: [
            { trackTitle: "Money", file: "audios/TDSOTM/money.mp3" },
            { trackTitle: "Time", file: "audios/TDSOTM/Time.mp3" } 
        ]
    },
    { 
        title: "Teselia", 
        artist: "suei", 
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSshQdcG--1OpDBbvgkGDbICgjP2pIeMGhQ7g&s",
        songs: [
            { trackTitle: "Kaku", file: "audios/Teselia/kaku.mp3" },
            { trackTitle: "Knousee", file: "audios/Teselia/knousee.mp3" }
        ]
    },
    { 
        title: "Thriller", 
        artist: "Michael Jackson", 
        cover: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
        songs: [
            // Mantiene el nombre exacto de tu carpeta física "Thiller"
            { trackTitle: "Billie Jean", file: "audios/Thiller/BillieJean.mp3" },
            { trackTitle: "The Girl Is Mine", file: "audios/Thiller/TheGirlIsMine.mp3" }
        ]
    }
];

// Exportación por defecto para mantener limpia la arquitectura del reproductor
export default albums;