// js/canciones.js

const albums = [
  {
    title: "A Hard Day's Night",
    artist: "The Beatles",
    cover: "https://i.ytimg.com/vi/5en2JMLA8Z0/maxresdefault.jpg",
    genre: "Rock 'n' Roll",
    songs: [
      { trackTitle: "And I Love Her", file: "audios/AHDN/AndILoveHer.mp3", genre: "Rock Ballad" },
      { trackTitle: "If I Fell", file: "audios/AHDN/IfIFell.mp3", genre: "Rock" },
    ],
  },
  {
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    cover: "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png",
    genre: "Progressive Rock",
    songs: [
      { trackTitle: "Money", file: "audios/TDSOTM/money.mp3", genre: "Rock / Blues" },
      { trackTitle: "Time", file: "audios/TDSOTM/Time.mp3", genre: "Rock" },
    ],
  },
  {
    title: "Teselia",
    artist: "suei",
    cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSshQdcG--1OpDBbvgkGDbICgjP2pIeMGhQ7g&s",
    genre: "Soundtrack / VGM",
    songs: [
      { trackTitle: "Kaku", file: "audios/Teselia/kaku.mp3", genre: "Acoustic" },
      { trackTitle: "Knousee", file: "audios/Teselia/knousee.mp3", genre: "Jazz Fusion" },
    ],
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    cover: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
    genre: "Pop / R&B",
    songs: [
      { trackTitle: "The Girl Is Mine", file: "audios/Thriller/TheGirlIsMine.mp3", genre: "Rock / Pop" },
      { trackTitle: "Billie Jean", file: "audios/Thriller/BillieJean.mp3", genre: "Dance-Pop" },
    ],
  },
];

export default albums;
