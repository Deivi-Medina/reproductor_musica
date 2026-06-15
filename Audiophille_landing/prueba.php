<?php
require_once 'models/Database.php';
$db = new Database();
$conn = $db->getConnection();
if ($conn) echo "Conectado";
else echo "Error";
