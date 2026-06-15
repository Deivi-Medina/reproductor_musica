<?php
require_once dirname(__DIR__, 2) . '/config/database.php';
session_start();
$modal_message = $_SESSION['modal_message'] ?? null;
$modal_type = $_SESSION['modal_type'] ?? null;
unset($_SESSION['modal_message'], $_SESSION['modal_type']);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro | Audiophille's</title>
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/style.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            background: var(--bg-dark);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: auto;
            padding: 20px;
        }

        .register-container {
            max-width: 450px;
            width: 100%;
            background: var(--glass-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 32px;
            padding: 2rem;
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.5);
        }

        .register-container h2 {
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
            background: linear-gradient(135deg, #fff, var(--text-secondary));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .input-group {
            margin-bottom: 1rem;
        }

        .input-group input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--glass-border);
            border-radius: 40px;
            color: white;
            font-size: 1rem;
            outline: none;
            transition: all 0.2s;
        }

        .input-group input:focus {
            border-color: var(--blue-accent);
        }

        .btn-primary {
            width: 100%;
            padding: 12px;
            background: var(--blue-accent);
            border: none;
            border-radius: 40px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
        }

        .btn-primary:hover {
            background: var(--blue-hover);
            transform: translateY(-2px);
        }

        .login-link {
            text-align: center;
            margin-top: 1.5rem;
            color: var(--text-secondary);
        }

        .login-link a {
            color: var(--blue-accent);
            text-decoration: none;
            font-weight: 600;
        }

        .back-home {
            text-align: center;
            margin-top: 1rem;
        }

        .back-home a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
        }

        .helper-text {
            font-size: 0.7rem;
            color: var(--text-secondary);
            margin-top: 4px;
            padding-left: 12px;
        }
    </style>
</head>

<body>
    <div class="mesh-background"></div>

    <div class="register-container">
        <h2>🎵 Crear cuenta</h2>
        <form action="<?= BASE_URL ?>controllers/RegisterController.php" method="POST">
            <div class="input-group">
                <input type="text" name="username" placeholder="Nombre de usuario" required>
            </div>
            <div class="input-group">
                <input type="email" name="email" placeholder="Correo electrónico" required>
            </div>
            <div class="input-group">
                <input type="password" name="password" placeholder="Contraseña" required>
            </div>
            <div class="helper-text">🔐 Mínimo 8 caracteres: mayúscula, minúscula, número y símbolo</div>
            <button type="submit" class="btn-primary">Registrarse</button>
        </form>
        <div class="login-link">
            ¿Ya tienes cuenta? <a href="<?= BASE_URL ?>views/auth/login.php">Inicia sesión aquí</a>
        </div>
        <div class="back-home">
            <a href="<?= BASE_URL ?>index.php">← Volver al inicio</a>
        </div>
    </div>

    <!-- Modal de mensajes -->
    <div id="messageModal" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle">Aviso</h3>
                <button id="closeModalBtn" class="btn-close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <p id="modalMessage"></p>
            </div>
            <div class="modal-footer">
                <button id="modalAcceptBtn" class="btn-modal-primary">Aceptar</button>
            </div>
        </div>
    </div>

    <script>
        <?php if ($modal_message): ?>
            window.addEventListener('DOMContentLoaded', () => {
                const modal = document.getElementById('messageModal');
                const title = document.getElementById('modalTitle');
                const msg = document.getElementById('modalMessage');
                title.innerText = <?= json_encode($modal_type === 'error' ? 'Error' : 'Éxito') ?>;
                msg.innerText = <?= json_encode($modal_message) ?>;
                modal.classList.remove('hidden');

                const closeModal = () => modal.classList.add('hidden');
                document.getElementById('closeModalBtn').addEventListener('click', closeModal);
                document.getElementById('modalAcceptBtn').addEventListener('click', closeModal);
            });
        <?php endif; ?>
        lucide.createIcons();
    </script>
</body>

</html>