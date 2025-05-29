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

// 4) Rota de login — chama seu backend real
server.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Faz login no seu backend e obtém token + user
    const response = await axios.post(
      "https://api-homes-7kt5olzh4q-rj.a.run.app/api/auth/login",
      {
        email,
        password,
      }
    );

    const { accessToken, user } = response.data;

    // Retorna exatamente o que veio do backend
    return res.json({ accessToken, user });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Erro no servidor";
    return res.status(status).json({ message });
  }
});

// 5) Middleware de proteção — todas as outras rotas exigem token
server.use((req, res, next) => {
  if (req.path === "/auth/login") return next();

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
