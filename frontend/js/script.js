const API_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem('token');

// proteção de rota: só redireciona se não estiver no login e não tiver token
if (!token && !window.location.href.includes('index.html')) {
    window.location.href = 'index.html';
}

// função de sair para o dashboard
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

function getUrgencyStyle(urgencia) {
    if (urgencia === 'alta') return 'border-red-600 bg-red-900/20 text-red-100 ring-1 ring-red-500/50';
    if (urgencia === 'media') return 'border-yellow-500 bg-yellow-900/20 text-yellow-100';
    return 'border-green-500 bg-green-900/20 text-green-100';
}

// função para obter o estilo baseado no status
function getStatusStyle(status) {
    if (status === 'em_andamento') return 'bg-blue-900/60 text-blue-300 border border-blue-500/50';
    if (status === 'concluida') return 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50';
    return 'bg-slate-800 text-slate-400 border border-slate-700';
}

// mapeamento dos labels de status
const statusLabels = {
    'pendente': 'Não Iniciado',
    'em_andamento': 'Em Desenvolvimento',
    'concluida': 'Concluída'
};
// função para carregar as tarefas
async function carregar() {
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await res.json();
        const lista = document.getElementById('lista');
        if (!lista) return;

        lista.innerHTML = '';

        tasks.forEach(t => {
            const estiloUrgencia = getUrgencyStyle(t.urgencia);
            const estiloStatus = getStatusStyle(t.status);

            lista.innerHTML += `
        <div class="p-4 rounded-lg flex justify-between items-center border-l-8 shadow-lg transition-transform hover:scale-[1.01] mb-3 ${estiloUrgencia}">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-black/40">${t.urgencia}</span>
                    
                    <select onchange="mudarStatus(${t.id}, this.value)" class="text-[9px] font-black uppercase px-1 py-0.5 rounded border-none outline-none ${estiloStatus} cursor-pointer">
                        <option value="pendente" ${t.status === 'pendente' ? 'selected' : ''}>Não Iniciado</option>
                        <option value="em_andamento" ${t.status === 'em_andamento' ? 'selected' : ''}>Em Desenvolvimento</option>
                        <option value="concluida" ${t.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                    </select>

                    <p class="font-bold text-lg ml-2 text-white">${t.titulo}</p>
                </div>
                <p class="text-sm opacity-80 mb-3 text-slate-300">${t.descricao}</p>
                
                <div class="mt-2 flex flex-wrap gap-4 text-[10px] font-mono">
                    <div class="flex items-center gap-1 bg-black/30 p-1 px-2 rounded border border-white/5">
                        <span class="opacity-60 text-slate-400">📅 INÍCIO:</span>
                        <input type="date" value="${t.data_inicio || ''}" 
                            onchange="atualizarData(${t.id}, 'data_inicio', this.value)"
                            class="bg-transparent border-none text-slate-200 outline-none focus:text-blue-400 cursor-pointer">
                    </div>
                    <div class="flex items-center gap-1 bg-black/30 p-1 px-2 rounded border border-white/5">
                        <span class="opacity-60 text-slate-400">🏁 PRAZO:</span>
                        <input type="date" value="${t.data_limite || ''}" 
                            onchange="atualizarData(${t.id}, 'data_limite', this.value)"
                            class="bg-transparent border-none text-slate-200 outline-none focus:text-blue-400 cursor-pointer">
                    </div>
                </div>
            </div>
            
            <button onclick="deletar(${t.id})" class="hover:bg-red-600 p-2 rounded-full transition-colors text-white ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `;
        });
    } catch (err) {
        console.error("Erro ao carregar tarefas:", err);
    }
}

// função para atualizar datas com validação
async function atualizarData(id, campo, valor) {
    const card = document.querySelector(`[onclick*="deletar(${id})"]`).parentElement;
    const dataInicio = card.querySelector('input[onchange*="data_inicio"]').value;
    const dataLimite = card.querySelector('input[onchange*="data_limite"]').value;

    if (dataInicio && dataLimite && new Date(dataInicio) > new Date(dataLimite)) {
        alert("A data limite não pode ser menor que a data de início!");
        carregar(); // recarrega para desfazer a alteração inválida
        return;
    }
    // Atualiza a data no backend
    try {
        await fetch(`${API_URL}/tasks/${id}/data?campo=${campo}&valor=${valor}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        }); 
    } catch (err) {
        console.error("Erro ao atualizar data:", err);
    }
}
// função para mudar o status da tarefa
async function mudarStatus(id, novoStatus) {
    try {
        const res = await fetch(`${API_URL}/tasks/${id}/status?novo_status=${novoStatus}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            carregar();
        } else {
            alert("Erro ao atualizar status.");
        }
    } catch (err) {
        console.error("Erro de conexão:", err);
    }
}
// função para adicionar nova tarefa com validação de datas
async function add(event) {
    if (event) event.preventDefault();

    const titulo = document.getElementById('taskTitle').value;
    const descricao = document.getElementById('taskDesc').value;
    const urgencia = document.getElementById('taskUrgency').value;
    const status = document.getElementById('taskStatus').value;
    const inicio = document.getElementById('taskStart').value;
    const fim = document.getElementById('taskEnd').value;

    // validação das datas
    if (inicio && fim && new Date(inicio) > new Date(fim)) {
        alert("Erro: A data de início não pode ser maior que o prazo final!");
        return; // interrompe a função aqui mesmo
    }

    if (!titulo) {
        alert("O título é obrigatório!");
        return;
    }
// construção dos parâmetros da query
    const params = new URLSearchParams({
        titulo: titulo,
        descricao: descricao || "",
        urgencia: urgencia,
        status: status,
        data_inicio: inicio || "",
        data_limite: fim || ""
    });

    try {
        const response = await fetch(`${API_URL}/tasks?${params.toString()}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Limpa os campos após o sucesso
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskStart').value = '';
            document.getElementById('taskEnd').value = '';
            carregar();
        } else {
            const erroData = await response.json();
            alert("Erro ao criar tarefa: " + (erroData.detail || "Erro desconhecido"));
        }
    } catch (err) {
        console.error("Erro de conexão:", err);
    }
}
// função para deletar tarefa
async function deletar(id) {
    if (!confirm("Deseja mesmo excluir esta tarefa?")) return;

    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    carregar();
}

if (document.getElementById('lista')) {
    carregar();
}