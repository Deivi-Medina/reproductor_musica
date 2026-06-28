// js/modals.js

// Inyectamos el HTML y CSS de los modales si no existen
function injectModalStyles() {
  if (document.getElementById("custom-modal-styles")) return;
  const style = document.createElement("style");
  style.id = "custom-modal-styles";
  style.textContent = `
    .custom-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      visibility: hidden;
      opacity: 0;
      transition: visibility 0.2s, opacity 0.2s;
    }
    .custom-modal-overlay.active {
      visibility: visible;
      opacity: 1;
    }
    .custom-modal-container {
      background: rgba(20, 20, 28, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 420px;
      padding: 24px;
      transform: scale(0.95);
      transition: transform 0.2s;
    }
    .active .custom-modal-container {
      transform: scale(1);
    }
    .custom-modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #fff;
    }
    .custom-modal-message {
      font-size: 1rem;
      color: #c0c0c8;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .custom-modal-message strong {
      color: #ffffff;
      font-weight: 700;
    }
    .custom-modal-message br {
      display: block;
      margin: 4px 0;
      content: "";
    }
    .custom-modal-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    .custom-modal-btn {
      padding: 8px 20px;
      border-radius: 40px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }
    .custom-modal-btn.confirm {
      background: #007aff;
      color: white;
    }
    .custom-modal-btn.confirm:hover {
      background: #005fc1;
    }
    .custom-modal-btn.cancel:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .custom-modal-btn.danger {
      background: #ff3b30;
    }
    .custom-modal-btn.danger:hover {
      background: #cc2f25;
    }
    input.custom-modal-input {
      width: 100%;
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 12px;
      color: white;
      margin-bottom: 20px;
      font-size: 0.95rem;
    }
    input.custom-modal-input:focus {
      outline: none;
      border-color: #007aff;
    }
  `;
  document.head.appendChild(style);
}

function createModalElements() {
  if (document.getElementById("custom-modal-root")) return;
  const overlay = document.createElement("div");
  overlay.id = "custom-modal-root";
  overlay.className = "custom-modal-overlay";
  overlay.innerHTML = `
    <div class="custom-modal-container">
      <div class="custom-modal-title" id="customModalTitle">Confirmar</div>
      <div class="custom-modal-message" id="customModalMessage"></div>
      <div id="customModalDynamicContent"></div>
      <div class="custom-modal-buttons" id="customModalButtons"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  injectModalStyles();
}

let currentResolve = null;

function closeModal() {
  const overlay = document.getElementById("custom-modal-root");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      if (currentResolve) {
        currentResolve(null);
        currentResolve = null;
      }
    }, 200);
  }
}

/**
 * Muestra un alert personalizado (acepta HTML en el mensaje)
 */
export function showAlert(message, title = "Aviso") {
  return new Promise((resolve) => {
    createModalElements();
    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");

    dynamicDiv.innerHTML = "";
    titleEl.innerText = title;
    // ✅ Usamos innerHTML para permitir <br> y <strong>
    msgEl.innerHTML = message;

    buttonsDiv.innerHTML = `<button class="custom-modal-btn confirm" id="customAlertOk">Aceptar</button>`;

    const okBtn = document.getElementById("customAlertOk");
    const handler = () => {
      okBtn.removeEventListener("click", handler);
      closeModal();
      resolve();
    };
    okBtn.addEventListener("click", handler);

    overlay.classList.add("active");
  });
}

/**
 * Muestra un confirm personalizado (Sí/No) - acepta HTML
 * @returns Promise<boolean> true si confirma, false si cancela
 */
export function showConfirm(message, title = "Confirmar", confirmText = "Sí", cancelText = "No", isDanger = false) {
  return new Promise((resolve) => {
    createModalElements();
    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");

    dynamicDiv.innerHTML = "";
    titleEl.innerText = title;
    msgEl.innerHTML = message;

    const confirmClass = isDanger ? "danger" : "confirm";
    buttonsDiv.innerHTML = `
      <button class="custom-modal-btn cancel" id="customConfirmCancel">${cancelText}</button>
      <button class="custom-modal-btn ${confirmClass}" id="customConfirmOk">${confirmText}</button>
    `;

    const okBtn = document.getElementById("customConfirmOk");
    const cancelBtn = document.getElementById("customConfirmCancel");

    const cleanup = () => {
      okBtn.removeEventListener("click", okHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
      closeModal();
    };

    const okHandler = () => {
      cleanup();
      resolve(true);
    };
    const cancelHandler = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener("click", okHandler);
    cancelBtn.addEventListener("click", cancelHandler);

    overlay.classList.add("active");
  });
}

/**
 * Muestra un prompt personalizado con campo de texto
 * @returns Promise<string | null> el texto ingresado o null si cancela
 */
export function showPrompt(message, defaultValue = "", title = "Ingrese un valor") {
  return new Promise((resolve) => {
    createModalElements();
    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");

    dynamicDiv.innerHTML = `<input type="text" id="customPromptInput" class="custom-modal-input" value="${defaultValue.replace(/"/g, "&quot;")}" placeholder="${message}">`;
    titleEl.innerText = title;
    msgEl.innerHTML = message;

    buttonsDiv.innerHTML = `
      <button class="custom-modal-btn cancel" id="customPromptCancel">Cancelar</button>
      <button class="custom-modal-btn confirm" id="customPromptOk">Aceptar</button>
    `;

    const input = document.getElementById("customPromptInput");
    const okBtn = document.getElementById("customPromptOk");
    const cancelBtn = document.getElementById("customPromptCancel");

    const cleanup = () => {
      okBtn.removeEventListener("click", okHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
      closeModal();
    };

    const okHandler = () => {
      cleanup();
      resolve(input ? input.value : null);
    };
    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };

    okBtn.addEventListener("click", okHandler);
    cancelBtn.addEventListener("click", cancelHandler);

    overlay.classList.add("active");
    if (input) input.focus();
  });
}

// Para mantener compatibilidad, exponemos las funciones globalmente
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
