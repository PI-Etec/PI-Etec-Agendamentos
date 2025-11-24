// Event listener para capturar o evento de envio do formulário
document
  .getElementById("formCadastro")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    // Captura os dados do formulário
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      // Envia os dados via POST para o backend
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Cadastro realizado com sucesso!");
        // Você pode redirecionar o usuário para a página de login, por exemplo:
        // window.location.href = '/login.html';
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error("Erro ao enviar o cadastro:", error);
      alert("Erro ao realizar o cadastro. Tente novamente mais tarde.");
    }
  });
