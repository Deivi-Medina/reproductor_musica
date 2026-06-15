-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 15-06-2026 a las 01:31:15
-- Versión del servidor: 8.0.46-0ubuntu0.24.04.2
-- Versión de PHP: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `audiophiles_db`
--
CREATE DATABASE IF NOT EXISTS `audiophiles_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `audiophiles_db`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `albumes`
--

DROP TABLE IF EXISTS `albumes`;
CREATE TABLE IF NOT EXISTS `albumes` (
  `id_album` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `id_artista` int NOT NULL,
  `anio` int DEFAULT NULL,
  `caratula_url` varchar(255) NOT NULL DEFAULT '',
  `genero` varchar(50) DEFAULT NULL,
  `es_sistema` tinyint(1) DEFAULT '1',
  `id_usuario` int DEFAULT NULL,
  PRIMARY KEY (`id_album`),
  KEY `id_artista` (`id_artista`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `artistas`
--

DROP TABLE IF EXISTS `artistas`;
CREATE TABLE IF NOT EXISTS `artistas` (
  `id_artista` int NOT NULL AUTO_INCREMENT,
  `nombre_artista` varchar(100) NOT NULL,
  `pais` varchar(50) DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `biografia` text,
  PRIMARY KEY (`id_artista`),
  UNIQUE KEY `nombre_artista` (`nombre_artista`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `artistas_seguidos`
--

DROP TABLE IF EXISTS `artistas_seguidos`;
CREATE TABLE IF NOT EXISTS `artistas_seguidos` (
  `id_usuario` int NOT NULL,
  `nombre_artista` varchar(100) NOT NULL,
  PRIMARY KEY (`id_usuario`,`nombre_artista`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `canciones`
--

DROP TABLE IF EXISTS `canciones`;
CREATE TABLE IF NOT EXISTS `canciones` (
  `id_cancion` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `id_album` int DEFAULT NULL,
  `archivo_url` varchar(255) NOT NULL,
  `duracion_segundos` int DEFAULT NULL,
  `numero_pista` int DEFAULT NULL,
  `genero` varchar(50) DEFAULT NULL,
  `es_sistema` tinyint(1) DEFAULT '1',
  `id_usuario_subio` int DEFAULT NULL,
  `reproducciones` int DEFAULT '0',
  PRIMARY KEY (`id_cancion`),
  KEY `idx_canciones_album` (`id_album`),
  KEY `idx_canciones_usuario` (`id_usuario_subio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_eq`
--

DROP TABLE IF EXISTS `configuracion_eq`;
CREATE TABLE IF NOT EXISTS `configuracion_eq` (
  `id_usuario` int NOT NULL,
  `bass` int DEFAULT '0',
  `vocals` int DEFAULT '0',
  `treble` int DEFAULT '0',
  PRIMARY KEY (`id_usuario`)
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `favoritos`
--

DROP TABLE IF EXISTS `favoritos`;
CREATE TABLE IF NOT EXISTS `favoritos` (
  `id_usuario` int NOT NULL,
  `id_cancion` int NOT NULL,
  `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`,`id_cancion`),
  KEY `id_cancion` (`id_cancion`),
  KEY `idx_favoritos_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `playlists`
--

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE IF NOT EXISTS `playlists` (
  `id_playlist` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `portada_url` text,
  `descripcion` text,
  PRIMARY KEY (`id_playlist`),
  KEY `idx_playlists_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `playlist_canciones`
--

DROP TABLE IF EXISTS `playlist_canciones`;
CREATE TABLE IF NOT EXISTS `playlist_canciones` (
  `id_playlist` int NOT NULL,
  `id_cancion` int NOT NULL,
  `orden` int DEFAULT NULL,
  PRIMARY KEY (`id_playlist`,`id_cancion`),
  KEY `id_cancion` (`id_cancion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reproducciones_artista`
--

DROP TABLE IF EXISTS `reproducciones_artista`;
CREATE TABLE IF NOT EXISTS `reproducciones_artista` (
  `id_reproduccion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_artista` int DEFAULT NULL,
  `nombre_artista` varchar(100) DEFAULT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id_reproduccion`),
  KEY `id_artista` (`id_artista`),
  KEY `idx_reproducciones_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resenas`
--

DROP TABLE IF EXISTS `resenas`;
CREATE TABLE IF NOT EXISTS `resenas` (
  `id_review` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_cancion` int NOT NULL,
  `puntuacion` decimal(2,1) NOT NULL,
  `comentario` text NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `escuchada_nuevamente` tinyint(1) DEFAULT '0',
  `titulo_cancion_texto` varchar(100) NOT NULL,
  `artista_texto` varchar(100) NOT NULL,
  PRIMARY KEY (`id_review`),
  KEY `idx_resenas_usuario` (`id_usuario`),
  KEY `idx_resenas_cancion` (`id_cancion`)
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

DROP TABLE IF EXISTS `sesiones`;
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id_sesion` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `id_usuario` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` datetime NOT NULL,
  PRIMARY KEY (`id_sesion`),
  UNIQUE KEY `token` (`token`),
  KEY `id_usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre_usuario` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `albumes`
--
ALTER TABLE `albumes`
  ADD CONSTRAINT `albumes_ibfk_1` FOREIGN KEY (`id_artista`) REFERENCES `artistas` (`id_artista`) ON DELETE CASCADE;

--
-- Filtros para la tabla `artistas_seguidos`
--
ALTER TABLE `artistas_seguidos`
  ADD CONSTRAINT `artistas_seguidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `canciones`
--
ALTER TABLE `canciones`
  ADD CONSTRAINT `canciones_ibfk_1` FOREIGN KEY (`id_album`) REFERENCES `albumes` (`id_album`) ON DELETE SET NULL,
  ADD CONSTRAINT `canciones_ibfk_2` FOREIGN KEY (`id_usuario_subio`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `configuracion_eq`
--
ALTER TABLE `configuracion_eq`
  ADD CONSTRAINT `configuracion_eq_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `favoritos`
--
ALTER TABLE `favoritos`
  ADD CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `playlists`
--
ALTER TABLE `playlists`
  ADD CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Filtros para la tabla `playlist_canciones`
--
ALTER TABLE `playlist_canciones`
  ADD CONSTRAINT `playlist_canciones_ibfk_1` FOREIGN KEY (`id_playlist`) REFERENCES `playlists` (`id_playlist`) ON DELETE CASCADE,
  ADD CONSTRAINT `playlist_canciones_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reproducciones_artista`
--
ALTER TABLE `reproducciones_artista`
  ADD CONSTRAINT `reproducciones_artista_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `reproducciones_artista_ibfk_2` FOREIGN KEY (`id_artista`) REFERENCES `artistas` (`id_artista`) ON DELETE SET NULL;

--
-- Filtros para la tabla `resenas`
--
ALTER TABLE `resenas`
  ADD CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
