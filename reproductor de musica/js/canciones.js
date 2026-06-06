export const albums = [
    { 
        title: "The Dark Side of the Moon", 
        artist: "Pink Floyd", 
        cover: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
        songs: [
            // Salimos de 'js', entramos a 'audios', luego a 'TDSOTM'
            { trackTitle: "Money", file: "../audios/TDSOTM/money.mp3" },
            { trackTitle: "Time", file: "../audios/TDSOTM/Time.mp3" } // Ojo con la T mayúscula de Time.mp3
        ]
    },
    { 
        title: "Currents", 
        artist: "Tame Impala", 
        cover: "https://upload.wikimedia.org/wikipedia/en/9/9b/Tame_Impala_-_Currents.png",
        songs: [
            // Dejamos estas rutas listas para cuando descargues sus canciones en sus carpetas
            { trackTitle: "Let It Happen", file: "../audios/Currents/let_it_happen.mp3" },
            { trackTitle: "The Less I Know the Better", file: "../audios/Currents/the_less_i_know.mp3" }
        ]
    },
    { 
        title: "Teselia", 
        artist: "suei", 
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSshQdcG--1OpDBbvgkGDbICgjP2pIeMGhQ7g&s",
        songs: [
            // Sincronizado exactamente con kaku.mp3 y knousee.mp3 de tu carpeta
            { trackTitle: "Kaku", file: "../audios/Teselia/kaku.mp3" },
            { trackTitle: "Knousee", file: "../audios/Teselia/knousee.mp3" }
        ]
    },
    { 
        title: "AM", 
        artist: "Arctic Monkeys", 
        cover: "https://upload.wikimedia.org/wikipedia/en/0/04/Arctic_Monkeys_-_AM.png",
        songs: [
            { trackTitle: "Do I Wanna Know?", file: "../audios/AM/do_i_wanna_know.mp3" },
            { trackTitle: "R U Mine?", file: "../audios/AM/r_u_mine.mp3" }
        ]
    }
];