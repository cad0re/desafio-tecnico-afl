from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime

# Configurações de Segurança
SECRET_KEY = "sua_chave_secreta_aqui" 
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Banco de Dados
SQLALCHEMY_DATABASE_URL = "sqlite:///./todolist.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelos
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Todo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    descricao = Column(String)
    urgencia = Column(String, default="baixa")
    status = Column(String, default="pendente") 
    data_inicio = Column(String)
    data_limite = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    data_criacao = Column(String, default=lambda: datetime.now().strftime("%d/%m/%Y %H:%M"))

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AUTENTICAÇÃO ---

@app.post("/signup")
def signup(email: str, password: str, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.email == email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    hashed = pwd_context.hash(password)
    new_user = User(email=email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    return {"message": "Usuário criado!"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = jwt.encode({"sub": user.email}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user

# --- TAREFAS ---

@app.get("/tasks")
def list_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Todo).filter(Todo.owner_id == current_user.id).all()

@app.post("/tasks")
def create_task(
    titulo: str, 
    descricao: str, 
    urgencia: str = "baixa", 
    status: str = "pendente",
    data_inicio: str = None, 
    data_limite: str = None, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # --- NOVA VALIDAÇÃO DE DATAS NO SERVIDOR ---
    # Como as datas vêm como String (AAAA-MM-DD), o Python consegue compará-las diretamente
    if data_inicio and data_limite:
        if data_inicio > data_limite:
            raise HTTPException(
                status_code=400, 
                detail="A data de início não pode ser posterior ao prazo final."
            )

    new_task = Todo(
        titulo=titulo, 
        descricao=descricao, 
        urgencia=urgencia, 
        status=status,
        data_inicio=data_inicio, 
        data_limite=data_limite, 
        owner_id=current_user.id
    )
    
    db.add(new_task)
    db.commit()
    return {"message": "Tarefa criada!"}

@app.put("/tasks/{task_id}/status")
def update_status(task_id: int, novo_status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == current_user.id).first()
    if not task: raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    task.status = novo_status
    db.commit()
    return {"message": "Status atualizado!"}

@app.put("/tasks/{task_id}/data")
def update_task_date(task_id: int, campo: str, valor: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == current_user.id).first()
    if not task: raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    if campo == "data_inicio": task.data_inicio = valor
    elif campo == "data_limite": task.data_limite = valor
    
    db.commit()
    return {"message": "Data atualizada!"}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == current_user.id).first()
    if not task: raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    db.delete(task)
    db.commit()
    return {"message": "Deletada com sucesso"}