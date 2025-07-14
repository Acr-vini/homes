// 1) Importa libs do backend
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken"); // will use jwt.decode
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // para chamar o seu backend

// 2) Lê o seu db.json (ainda usado para roteamento CRUD estático)
const dbPath = path.join(__dirname, "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "UTF-8"));
const users = db.users || [];

// 3) Cria o servidor JSON-Server
const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();
server.use(middlewares);
server.use(jsonServer.bodyParser);

// NOVA ROTA DE PROXY PARA O ZIPPOPOTAM
server.get("/api/zipcode/:zip", async (req, res) => {
  const zipCode = req.params.zip;
  try {
    const response = await axios.get(`https://api.zippopotam.us/us/${zipCode}`);
    res.json(response.data);
  } catch (error) {
    // Se a API externa der erro (ex: 404 para CEP inválido), repassa o erro.
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch data from Zippopotam API.",
    });
  }
});

// 4) Rota de login — autentica usando o db.json local
server.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Sempre leia o db.json atualizado
  const db = JSON.parse(fs.readFileSync(dbPath, "UTF-8"));
  const users = db.users || [];
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "E-mail ou senha inválidos" });
  }
  if (user.status === "disabled") {
    return res.status(403).json({ message: "Usuário desabilitado" });
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    "secret",
    { expiresIn: "1h" }
  );

  // Não envie a senha de volta!
  const { password: _, ...userWithoutPassword } = user;

  return res.json({ accessToken, user: userWithoutPassword });
});

// 5) Middleware de proteção — todas as outras rotas exigem token
server.use((req, res, next) => {
  // PERMITE a rota de login, a rota de criação de usuário E a rota de CEP sem token
  if (
    req.path === "/auth/login" ||
    (req.path === "/users" && req.method === "POST") ||
    req.path.startsWith("/api/zipcode/") // Adicione esta linha
  ) {
    return next(); // Permite o acesso
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token ausente" });
  }

  const token = authHeader.split(" ")[1];

  // Decodifica sem verificar assinatura
  const decoded = jwt.decode(token);
  if (!decoded) {
    return res.status(403).json({ message: "Token inválido ou malformado" });
  }

  // Anexa dados do usuário ao request
  req.user = decoded;
  next();
});

// 6) Usa o router default do JSON-Server para CRUD de /users, /locations, etc.
server.use(router);

// 7) Inicia na porta 3000
server.listen(3000, () => {
  console.log("JSON-Server rodando na porta 3000");
});
