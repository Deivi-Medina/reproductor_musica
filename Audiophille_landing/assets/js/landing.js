// ==========================================
// FUNCIONES PARA MANEJAR MODALES
// ==========================================

function openModal(type) {
  const modalId = type === "login" ? "loginModal" : "registerModal";
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";

  const passwordInput = modal.querySelector('input[type="password"]');
  if (passwordInput) {
    passwordInput.removeEventListener("input", handlePasswordInput);
    passwordInput.addEventListener("input", handlePasswordInput);
    updatePasswordRequirements(passwordInput);
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function switchModal(type) {
  closeModal("loginModal");
  closeModal("registerModal");
  openModal(type);
}

function showModalMessage(title, message) {
  const modal = document.getElementById("messageModal");
  const titleEl = document.getElementById("modalTitle");
  const msgEl = document.getElementById("modalMessage");
  titleEl.innerText = title;
  msgEl.innerText = message;
  modal.style.display = "flex";
}

// ==========================================
// FUNCIONES PARA AUTH (TOGGLE PASSWORD, VALIDACIÓN)
// ==========================================

function togglePasswordVisibility(button) {
  const wrapper = button.closest(".password-wrapper");
  if (!wrapper) return;
  const input = wrapper.querySelector("input");
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  const icon = button.querySelector("i");
  if (icon) {
    icon.setAttribute("data-lucide", isPassword ? "eye" : "eye-off");
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }
}

function validatePasswordStrength(password) {
  const rules = [
    { regex: /.{8,}/, id: "length", label: "Mínimo 8 caracteres" },
    { regex: /[A-Z]/, id: "uppercase", label: "Mayúscula" },
    { regex: /[a-z]/, id: "lowercase", label: "Minúscula" },
    { regex: /[0-9]/, id: "number", label: "Número" },
    { regex: /[^A-Za-z0-9]/, id: "symbol", label: "Símbolo" },
  ];
  return rules.map((rule) => ({
    ...rule,
    met: rule.regex.test(password),
  }));
}

function updatePasswordRequirements(input) {
  let container = input.closest(".auth-input-group")?.querySelector(".password-requirements");
  if (!container) {
    const modal = input.closest(".modal");
    if (modal) {
      container = modal.querySelector(".password-requirements");
    }
  }
  if (!container) return;

  const password = input.value;
  const results = validatePasswordStrength(password);

  results.forEach((result) => {
    const item = container.querySelector(`.req-item[data-rule="${result.id}"]`);
    if (item) {
      const icon = item.querySelector(".req-icon");
      if (result.met) {
        item.classList.add("met");
        if (icon) icon.textContent = "✅";
      } else {
        item.classList.remove("met");
        if (icon) icon.textContent = "⬜";
      }
    }
  });
}

function handlePasswordInput(e) {
  updatePasswordRequirements(e.target);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("openLoginBtn").addEventListener("click", () => openModal("login"));
  document.getElementById("openRegisterBtn").addEventListener("click", () => openModal("register"));
  document.getElementById("heroRegisterBtn").addEventListener("click", () => openModal("register"));

  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) closeModal(modal.id);
    });
  });

  document.querySelector("#messageModal .auth-btn-primary")?.addEventListener("click", function (e) {
    e.preventDefault();
    closeModal("messageModal");
  });

  document.querySelectorAll("[data-switch]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const type = this.getAttribute("data-switch");
      switchModal(type);
    });
  });

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      closeModal(event.target.id);
    }
  });

  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest(".toggle-password");
    if (toggleBtn) {
      e.preventDefault();
      togglePasswordVisibility(toggleBtn);
    }
  });

  document.addEventListener("input", function (e) {
    const input = e.target;
    if (input.matches('.auth-input-group input[type="password"]')) {
      updatePasswordRequirements(input);
    }
  });

  const body = document.body;
  const message = body.getAttribute("data-message");
  const type = body.getAttribute("data-type");
  if (message && message.trim() !== "") {
    const title = type === "error" ? "Error" : "Éxito";
    showModalMessage(title, message);
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  document.querySelectorAll('.auth-input-group input[type="password"]').forEach((input) => {
    if (input.closest(".modal") && input.closest(".modal").style.display !== "none") {
      updatePasswordRequirements(input);
    }
  });
});
