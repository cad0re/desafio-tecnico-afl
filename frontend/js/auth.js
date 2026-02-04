
const API_URL = "http://127.0.0.1:8000";
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
async function cadastrar(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('msg');

    if (!email || !password) {
        msg.className = "mt-4 text-center text-sm font-bold text-yellow-500";
        msg.innerText = "Preencha todos os campos!";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/signup?email=${email}&password=${password}`, {
            method: 'POST'
        });

        if (response.ok) {
            msg.className = "mt-4 text-center text-sm font-bold text-indigo-400";
            msg.innerText = "Usuário criado com sucesso! Redirecionando...";

            // TESTE: Se o redirecionamento falhar com 2s, 
            // reduza para 500ms ou mude direto para testar a funcionalidade
            setTimeout(() => {
                window.location.assign('index.html');
            }, 1500);
        } else {
            const data = await response.json();
            msg.className = "mt-4 text-center text-sm font-bold text-red-500";
            msg.innerText = data.detail || "Erro ao cadastrar usuário.";
        }
    } catch (err) {
        msg.className = "mt-4 text-center text-sm font-bold text-red-500";
        msg.innerText = "Erro: Servidor não encontrado!";
    }
}