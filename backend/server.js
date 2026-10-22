const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }

  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(u =>
    u.usuario === req.body.usuario &&
    u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});


 // CADASTRAR USUÁRIOS
app.post("/usuarios", (req, res) => {
  const db = readDB();

  const { usuario, senha, tipo } = req.body;

  if (!usuario || !senha || !tipo) {
    return res.status(400).json({
      erro: "Preencha todos os campos."
    });
  }

  const existe = db.usuarios.some(
    u => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
  );

  if (existe) {
    return res.status(409).json({
      erro: "Este usuário já está cadastrado."
    });
  }

  const novoUsuario = {
    id: Date.now(),
    usuario: usuario.trim(),
    senha,
    tipo
  };

  db.usuarios.push(novoUsuario);
  writeDB(db);

  res.status(201).json({
    mensagem: "Usuário cadastrado com sucesso!",
    usuario: novoUsuario.usuario,
    tipo: novoUsuario.tipo
  });
});

// LISTAR USUÁRIOS
app.get("/usuarios", (req, res) => {
  const db = readDB();

  const usuarios = db.usuarios.map(u => ({
    id: u.id,
    usuario: u.usuario,
    tipo: u.tipo
  }));

  res.json(usuarios);
});


// ATENDIMENTO
app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date()
  };

  db.pacientes.push(paciente);
  writeDB(db);

  res.json(paciente);
});

// TRIAGEM
app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  if (req.body.temperatura >= 39) {
    risco = "vermelho";
  } else if (req.body.temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco,
    status: "aguardando_medico",
    createdAt: new Date()
  };

  db.triagens.push(triagem);
  writeDB(db);

  res.json(triagem);
});

// LISTAR TRIAGENS
app.get("/triagens", (req, res) => {
  const db = readDB();
  res.json(db.triagens);
});

// IMPLEMENTADO: rota com lista fixa de medicações
app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// CONSULTA
app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date()
  };

  db.consultas.push(consulta);
  writeDB(db);

  res.json(consulta);
});

// MEDICAÇÕES
app.get("/medicacoes", (req, res) => {
  const db = readDB();
  res.json(db.consultas);
});


/* ===== CHAMADAS DA TV ===== */

// Guarda a chamada atual e as últimas chamadas
let chamadaAtual = null;
let historicoChamadas = [];

// Enviar uma chamada para a TV
app.post("/tv/chamar", (req, res) => {
  const { nome, paciente, localTipo, localNumero } = req.body;

  const nomePaciente = nome || paciente;

  if (!nomePaciente) {
    return res.status(400).json({
      erro: "Informe o nome do paciente."
    });
  }

  chamadaAtual = {
    id: Date.now(),
    paciente: nomePaciente,
    localTipo: localTipo || "GUICHÊ",
    localNumero: localNumero || "---",
    data: new Date().toISOString()
  };

  historicoChamadas.unshift(chamadaAtual);
  historicoChamadas = historicoChamadas.slice(0, 4);

  res.json({
    mensagem: "Paciente chamado com sucesso.",
    chamada: chamadaAtual
  });
});

// Entregar a chamada atual e o histórico para a TV
app.get("/tv/chamado", (req, res) => {
  res.json({
    chamada: chamadaAtual,
    historico: historicoChamadas
  });
});


app.get("/pacientes", (req, res) => {
  const db = readDB();
  res.json(db.pacientes || []);
});


// START
app.listen(3000, () => {
  console.log("🏥 Hospital Pro rodando em http://localhost:3000");
});