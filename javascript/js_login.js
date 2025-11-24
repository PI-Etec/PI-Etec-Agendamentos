const form = document.querySelector("form");
const msg = document.getElementById("mensagem");

// Elementos do modal de termos
const termsModal = document.getElementById("terms-modal");
const termsCheckbox = document.getElementById("terms-checkbox");
const termsAccept = document.getElementById("terms-accept");
const termsCancel = document.getElementById("terms-cancel");
const termsError = document.getElementById("terms-error");

function showTermsModal() {
  if (termsModal) {
    termsError.style.display = "none";
    termsCheckbox.checked = false;
    termsModal.style.display = "flex";
    // optionally trap focus here if needed
  }
}

function hideTermsModal() {
  if (termsModal) termsModal.style.display = "none";
}

async function performLogin(email, senha) {
  msg.textContent = "";
  if (!email || !senha) {
    msg.style.color = "red";
    msg.textContent = "Preencha todos os campos!";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (data.nome) {
        localStorage.setItem("nomeUsuario", data.nome);
      }

      msg.style.color = "green";
      msg.textContent = "Login efetuado com sucesso!";

      setTimeout(() => {
        switch (data.role) {
          case "professor.com":
            window.location.href = "../html/tela_professor.html";
            break;
          case "adm.com":
            window.location.href = "../html/tela_adiministrador.html";
            break;
          case "tecnico.com":
            window.location.href = "../html/tela_tecnico.html";
            break;
          default:
            msg.style.color = "red";
            msg.textContent = "Domínio de e-mail inválido.";
        }
      }, 800);
    } else {
      msg.style.color = "red";
      msg.textContent = data.message || "Erro ao fazer login.";
    }
  } catch (err) {
    console.error("Erro ao conectar com o backend:", err);
    msg.style.color = "red";
    msg.textContent = "Erro ao conectar com o servidor.";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  // abrir modal de termos antes de efetuar o login
  showTermsModal();

  // onclick handlers will call performLogin when accepted
  // ensure we don't add multiple listeners if user clicks submit repeatedly
  const onAccept = () => {
    if (!termsCheckbox.checked) {
      termsError.style.display = "";
      return;
    }
    hideTermsModal();
    // cleanup handlers
    termsAccept.removeEventListener("click", onAccept);
    termsCancel.removeEventListener("click", onCancel);
    performLogin(email, senha);
  };

  const onCancel = () => {
    hideTermsModal();
    termsAccept.removeEventListener("click", onAccept);
    termsCancel.removeEventListener("click", onCancel);
  };

  termsAccept.removeEventListener("click", onAccept);
  termsCancel.removeEventListener("click", onCancel);
  termsAccept.addEventListener("click", onAccept);
  termsCancel.addEventListener("click", onCancel);
});
