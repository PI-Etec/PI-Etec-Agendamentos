
document.getElementById('formCadastro').addEventListener('submit', async (event) => {
event.preventDefault();


const nome = document.getElementById('nome').value;
const email = document.getElementById('email').value;
const senha = document.getElementById('senha').value;

try {
    
    const response = await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome, email, senha })
});


    const data = await response.json();

    if (response.ok) {
    alert('Cadastro realizado com sucesso!');
    } else {
        alert(`Erro: ${data.message}`);
            }
        } catch (error) {
            console.error('Erro ao enviar o cadastro:', error);
            alert('Erro ao realizar o cadastro. Tente novamente mais tarde.');
            }
        });