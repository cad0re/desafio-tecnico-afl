# 🚀 Desafio Técnico AFL - To-Do List

Aplicação Full Stack desenvolvida para o processo seletivo da **AFL Consultores**. O sistema gerencia tarefas com autenticação JWT e isolamento total de dados.

## 🛠️ Funcionalidades
* **Autenticação JWT**: Cadastro e login seguros com criptografia `bcrypt`.
* **Isolamento de Dados**: Cada usuário acessa exclusivamente suas próprias tarefas.
* **Validação de Datas**: Bloqueio de tarefas com prazo anterior à data de início.
* **Interface Moderna**: UI responsiva construída com Tailwind CSS.

## ⚙️ Tecnologias
* **Backend**: Python, FastAPI, SQLAlchemy (SQLite).
* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS.

## 🏁 Como Executar

### 1. Configurar o Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload

2. Acessar o Frontend
Basta abrir o arquivo index.html diretamente no seu navegador.

Desenvolvido por João Victor Cadore