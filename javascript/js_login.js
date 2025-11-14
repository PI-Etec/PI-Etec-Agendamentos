const form = document.querySelector('form');
const msg = document.getElementById('mensagem');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  msg.textContent = ''; // limpa mensagem anterior

  if (!email || !senha) {
    msg.style.color = 'red';
    msg.textContent = 'Preencha todos os campos!';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    console.log('Resposta do login:', data); // Adicione esta linha para depurar

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (data.nome) {
        localStorage.setItem('nomeUsuario', data.nome);
        // Adicione estas duas linhas para depuração
        console.log('Origem da página de login:', window.location.origin);
        console.log('nomeUsuario salvo no localStorage:', localStorage.getItem('nomeUsuario'));
      }

      msg.style.color = 'green';
      msg.textContent = 'Login efetuado com sucesso!';

      setTimeout(() => {
        switch (data.role) {
          case 'professor.com':
            window.location.href = '../html/tela_professor.html';
            break;
          case 'adm.com':
            window.location.href = '../html/tela_adiministrador.html';
            break;
          case 'tecnico.com':
            window.location.href = '../html/tela_tecnico.html';
            break;
          default:
            msg.style.color = 'red';
            msg.textContent = 'Domínio de e-mail inválido.';
        }
      }, 800);
    } else {
      msg.style.color = 'red';
      msg.textContent = data.message || 'Erro ao fazer login.';
    }
  } catch (err) {
    console.error('Erro ao conectar com backend:', err);
    msg.style.color = 'red';
    msg.textContent = '❌ Erro ao conectar com o servidor.';
  }
});