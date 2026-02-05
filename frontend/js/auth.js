
const API_URL = "http://127.0.0.1:8000";

// adiciona o listener ao botão após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-cadastrar');
    if (btn) {
        btn.addEventListener('click', cadastrar);
    }
});
// função para cadastro
async function cadastrar() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    if (!email || !password) {
        msg.innerText = "Preencha todos os campos!";
        return;
    }
    try {
        console.log("Tentando cadastrar...");
        const response = await fetch(`${API_URL}/signup?email=${email}&password=${password}`, {
            method: 'POST'
        });

        if (response.ok) {
            msg.className = "mt-4 text-center text-sm font-bold text-indigo-400";
            msg.innerText = "Sucesso! Redirecionando agora...";
            
            console.log("Cadastro OK. Redirecionando em 1 segundo...");
            
            // Força o redirecionamento absoluto para evitar erros de pasta
            setTimeout(() => {
                window.location.assign("index.html");
            }, 1000);
        } else {
            const data = await response.json();
            msg.innerText = data.detail || "Erro ao cadastrar.";
        }
    } catch (err) {
        console.error("Erro na conexão:", err);
        msg.innerText = "Servidor offline!";
    }
}                 


// função para login 
async function logar() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            window.location.href = 'dashboard.html'; // Vai para a lista de tarefas
        } else {
            msg.innerText = "Erro: " + (data.detail || "Falha no login");
        }
    } catch (err) {
        msg.innerText = "Servidor offline!";
    }
}

// Adiciona listener para tecla Enter para facilitar o envio do formulário
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (document.getElementById('btn-cadastrar')) {
            cadastrar();
        } else if (document.querySelector('button[onclick="logar()"]')) {
            logar();
        }
    }
});
