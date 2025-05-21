// 1) Importa libs do backend
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// 2) Lê o seu db.json
const dbPath = path.join(__dirname, "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "UTF-8"));
const users = db.users || [];

// 3) Configura JWT
const SECRET_KEY = "sua-chave-secreta";
const TOKEN_EXPIRES = "1h";

// 4) Cria o servidor JSON-Server
const server = jsonServer.create();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();
server.use(middlewares);
server.use(jsonServer.bodyParser);

// 5) Rota de login — gera JWT real
server.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Credenciais inválidas" });

  // 5.1) Gera o token
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
    expiresIn: TOKEN_EXPIRES,
  });

  // 5.2) Retorna token + dados do user
  res.json({ accessToken: token, user });
});

// 6) Middleware de proteção — todas as outras rotas exigem JWT
server.use((req, res, next) => {
  if (req.path === "/login") return next();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token ausente" });

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch {
    res.status(403).json({ message: "Token inválido" });
  }
});

// 7) Usa o router default do JSON-Server para CRUD de /users, /locations, etc.
server.use(router);

// 8) Inicia na porta 3000
server.listen(3000, () => {
  console.log("JSON-Server com JWT em http://localhost:3000");
});
