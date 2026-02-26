import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Initialization with optimized settings
const db = new Database("vacina_ja.db");
db.pragma('journal_mode = WAL'); // Better performance for concurrent reads/writes

// Initialize database schema with professional constraints and indices
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'enfermeiro')) DEFAULT 'enfermeiro',
    nome_completo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo TEXT CHECK(sexo IN ('M', 'F')),
    gravida BOOLEAN DEFAULT 0,
    mulher_idade_fertil BOOLEAN DEFAULT 0,
    puerpera BOOLEAN DEFAULT 0,
    data_parto DATE,
    localidade TEXT,
    contacto_responsavel TEXT,
    numero_identificacao TEXT UNIQUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_paciente_nome ON pacientes(nome);
  CREATE INDEX IF NOT EXISTS idx_paciente_bi ON pacientes(numero_identificacao);

  CREATE TABLE IF NOT EXISTS vacinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    doses_por_frasco INTEGER NOT NULL,
    prazo_uso_horas INTEGER NOT NULL,
    grupo_alvo TEXT, -- crianca | mif | gravida | puerpera | adulto | hpv
    total_doses_esquema INTEGER NOT NULL,
    idade_minima_meses INTEGER DEFAULT 0,
    idade_maxima_meses INTEGER DEFAULT 1200
  );

  CREATE TABLE IF NOT EXISTS frascos_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vacina_id INTEGER,
    lote TEXT NOT NULL,
    validade DATE NOT NULL,
    doses_restantes INTEGER NOT NULL,
    estado TEXT CHECK(estado IN ('disponivel', 'aberto', 'consumido', 'expirado')) DEFAULT 'disponivel',
    data_abertura DATETIME,
    data_expiracao_uso DATETIME,
    data_entrada DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (vacina_id) REFERENCES vacinas(id)
  );
  CREATE INDEX IF NOT EXISTS idx_stock_vacina ON frascos_stock(vacina_id, estado);

  CREATE TABLE IF NOT EXISTS administracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER,
    vacina_id INTEGER,
    frasco_id INTEGER,
    user_id INTEGER,
    numero_dose INTEGER NOT NULL,
    data_administracao DATE DEFAULT CURRENT_DATE,
    observacoes TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (vacina_id) REFERENCES vacinas(id),
    FOREIGN KEY (frasco_id) REFERENCES frascos_stock(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_admin_data ON administracoes(data_administracao);

  CREATE TABLE IF NOT EXISTS desperdicio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    frasco_id INTEGER,
    doses_desperdicadas INTEGER NOT NULL,
    motivo TEXT CHECK(motivo IN ('prazo_expirado', 'validade_vencida', 'outro')),
    data_registo DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (frasco_id) REFERENCES frascos_stock(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    acao TEXT NOT NULL,
    entidade TEXT,
    entidade_id INTEGER,
    detalhes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data
const seedData = () => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count === 0) {
    db.prepare("INSERT INTO users (username, password, role, nome_completo) VALUES (?, ?, ?, ?)").run('admin', 'admin123', 'admin', 'Administrador do Posto');
    db.prepare("INSERT INTO users (username, password, role, nome_completo) VALUES (?, ?, ?, ?)").run('enfermeiro', 'pav123', 'enfermeiro', 'Enfermeiro de Turno');
  }

  const vaccineCount = db.prepare("SELECT COUNT(*) as count FROM vacinas").get() as any;
  if (vaccineCount.count === 0) {
    const insertVaccine = db.prepare(`
      INSERT INTO vacinas (nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema, idade_minima_meses, idade_maxima_meses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const initialVaccines = [
      ["BCG", 20, 6, "crianca", 1, 0, 12],
      ["HepB0", 1, 24, "crianca", 1, 0, 1],
      ["Polio 0", 20, 72, "crianca", 1, 0, 1],
      ["Polio 1", 20, 72, "crianca", 1, 2, 60],
      ["Penta 1", 10, 168, "crianca", 1, 2, 24],
      ["Pneumo 1", 1, 168, "crianca", 1, 2, 24],
      ["Rotavirus 1", 1, 24, "crianca", 1, 2, 4],
      ["HPV", 1, 168, "hpv", 2, 108, 144],
      ["Toxoide Td", 10, 168, "mif", 5, 180, 600],
      ["Vitamina A", 1, 24, "puerpera", 1, 180, 600]
    ];

    for (const v of initialVaccines) {
      insertVaccine.run(...v);
    }
  }
};
seedData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware for simple logging
  const logAction = (userId: number, acao: string, entidade?: string, entidadeId?: number, detalhes?: string) => {
    try {
      db.prepare("INSERT INTO audit_logs (user_id, acao, entidade, entidade_id, detalhes) VALUES (?, ?, ?, ?, ?)").run(userId, acao, entidade, entidadeId, detalhes);
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  // Auth API
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role, nome_completo FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      logAction(user.id, "LOGIN", "users", user.id);
      res.json(user);
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  // Users API
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, nome_completo FROM users ORDER BY nome_completo ASC").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, nome_completo } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO users (username, password, role, nome_completo)
        VALUES (?, ?, ?, ?)
      `).run(username, password, role, nome_completo);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { username, password, role, nome_completo } = req.body;
    try {
      if (password) {
        db.prepare(`
          UPDATE users SET username = ?, password = ?, role = ?, nome_completo = ?
          WHERE id = ?
        `).run(username, password, role, nome_completo, req.params.id);
      } else {
        db.prepare(`
          UPDATE users SET username = ?, role = ?, nome_completo = ?
          WHERE id = ?
        `).run(username, role, nome_completo, req.params.id);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Patients API
  app.get("/api/pacientes", (req, res) => {
    const q = req.query.q as string;
    let patients;
    if (q) {
      patients = db.prepare("SELECT * FROM pacientes WHERE nome LIKE ? OR numero_identificacao LIKE ?").all(`%${q}%`, `%${q}%`);
    } else {
      patients = db.prepare("SELECT * FROM pacientes ORDER BY criado_em DESC LIMIT 50").all();
    }
    res.json(patients);
  });

  app.post("/api/pacientes", (req, res) => {
    const { nome, data_nascimento, sexo, gravida, mulher_idade_fertil, puerpera, data_parto, localidade, contacto_responsavel, numero_identificacao, userId } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO pacientes (nome, data_nascimento, sexo, gravida, mulher_idade_fertil, puerpera, data_parto, localidade, contacto_responsavel, numero_identificacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nome, data_nascimento, sexo, gravida ? 1 : 0, mulher_idade_fertil ? 1 : 0, puerpera ? 1 : 0, data_parto, localidade, contacto_responsavel, numero_identificacao);
      
      logAction(userId || 1, "CREATE", "pacientes", Number(info.lastInsertRowid), `Paciente: ${nome}`);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/pacientes/:id", (req, res) => {
    const { nome, data_nascimento, sexo, gravida, mulher_idade_fertil, puerpera, data_parto, localidade, contacto_responsavel, numero_identificacao, userId } = req.body;
    try {
      db.prepare(`
        UPDATE pacientes SET nome = ?, data_nascimento = ?, sexo = ?, gravida = ?, mulher_idade_fertil = ?, puerpera = ?, data_parto = ?, localidade = ?, contacto_responsavel = ?, numero_identificacao = ?
        WHERE id = ?
      `).run(nome, data_nascimento, sexo, gravida ? 1 : 0, mulher_idade_fertil ? 1 : 0, puerpera ? 1 : 0, data_parto, localidade, contacto_responsavel, numero_identificacao, req.params.id);
      
      logAction(userId || 1, "UPDATE", "pacientes", Number(req.params.id), `Paciente: ${nome}`);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/pacientes/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM pacientes WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/pacientes/:id", (req, res) => {
    const patient = db.prepare("SELECT * FROM pacientes WHERE id = ?").get(req.params.id);
    const history = db.prepare(`
      SELECT a.*, v.nome as vacina_nome, u.nome_completo as responsavel_nome
      FROM administracoes a 
      JOIN vacinas v ON a.vacina_id = v.id 
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.paciente_id = ?
      ORDER BY a.data_administracao DESC
    `).all(req.params.id);
    res.json({ ...patient, history });
  });

  // Vaccines API
  app.get("/api/vacinas", (req, res) => {
    const vaccines = db.prepare("SELECT * FROM vacinas ORDER BY nome ASC").all();
    res.json(vaccines);
  });

  app.post("/api/vacinas", (req, res) => {
    const { nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO vacinas (nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema)
        VALUES (?, ?, ?, ?, ?)
      `).run(nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/vacinas/:id", (req, res) => {
    const { nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema } = req.body;
    try {
      db.prepare(`
        UPDATE vacinas SET nome = ?, doses_por_frasco = ?, prazo_uso_horas = ?, grupo_alvo = ?, total_doses_esquema = ?
        WHERE id = ?
      `).run(nome, doses_por_frasco, prazo_uso_horas, grupo_alvo, total_doses_esquema, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/vacinas/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM vacinas WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Stock API
  app.get("/api/stock", (req, res) => {
    const stock = db.prepare(`
      SELECT v.nome as vacina_nome, v.id as vacina_id, 
             SUM(CASE WHEN f.estado = 'disponivel' THEN 1 ELSE 0 END) as frascos_disponiveis,
             SUM(CASE WHEN f.estado = 'aberto' THEN 1 ELSE 0 END) as frascos_abertos,
             MIN(CASE WHEN f.estado = 'disponivel' THEN f.validade ELSE NULL END) as validade_proxima
      FROM vacinas v
      LEFT JOIN frascos_stock f ON v.id = f.vacina_id
      GROUP BY v.id
    `).all();
    res.json(stock);
  });

  app.get("/api/stock/abertos", (req, res) => {
    const abertos = db.prepare(`
      SELECT f.*, v.nome as vacina_nome, v.prazo_uso_horas
      FROM frascos_stock f
      JOIN vacinas v ON f.vacina_id = v.id
      WHERE f.estado = 'aberto' AND f.doses_restantes > 0
      ORDER BY f.data_expiracao_uso ASC
    `).all();
    res.json(abertos);
  });

  app.post("/api/stock/entrada", (req, res) => {
    const { vacina_id, lote, validade, quantidade, userId } = req.body;
    const vacina = db.prepare("SELECT doses_por_frasco, nome FROM vacinas WHERE id = ?").get(vacina_id) as any;
    
    const insert = db.prepare(`
      INSERT INTO frascos_stock (vacina_id, lote, validade, doses_restantes, estado)
      VALUES (?, ?, ?, ?, 'disponivel')
    `);

    for (let i = 0; i < quantidade; i++) {
      insert.run(vacina_id, lote, validade, vacina.doses_por_frasco);
    }
    logAction(userId || 1, "STOCK_ENTRY", "vacinas", vacina_id, `Entrada de ${quantidade} frascos de ${vacina.nome}, lote ${lote}`);
    res.json({ success: true });
  });

  app.get("/api/stock/history", (req, res) => {
    const history = db.prepare(`
      SELECT f.*, v.nome as vacina_nome 
      FROM frascos_stock f 
      JOIN vacinas v ON f.vacina_id = v.id 
      ORDER BY f.data_entrada DESC 
      LIMIT 100
    `).all();
    res.json(history);
  });

  app.delete("/api/stock/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM frascos_stock WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: "Não é possível eliminar um frasco com administrações registadas." });
    }
  });

  // Administration API
  app.post("/api/administrar", (req, res) => {
    const { paciente_id, vacina_id, user_id, observacoes } = req.body;
    
    // 1. Find open vial
    let vial = db.prepare(`
      SELECT * FROM frascos_stock 
      WHERE vacina_id = ? AND estado = 'aberto' AND doses_restantes > 0 AND data_expiracao_uso > datetime('now')
    `).get(vacina_id) as any;

    if (!vial) {
      vial = db.prepare(`
        SELECT * FROM frascos_stock 
        WHERE vacina_id = ? AND estado = 'disponivel' AND validade > date('now')
        ORDER BY validade ASC LIMIT 1
      `).get(vacina_id) as any;

      if (!vial) {
        return res.status(400).json({ error: "Sem stock disponível para esta vacina." });
      }

      const vacina = db.prepare("SELECT prazo_uso_horas FROM vacinas WHERE id = ?").get(vacina_id) as any;
      const dataAbertura = new Date().toISOString();
      const dataExpiracao = new Date(Date.now() + vacina.prazo_uso_horas * 60 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE frascos_stock 
        SET estado = 'aberto', data_abertura = ?, data_expiracao_uso = ? 
        WHERE id = ?
      `).run(dataAbertura, dataExpiracao, vial.id);
      logAction(user_id, "OPEN_VIAL", "frascos_stock", vial.id);
    }

    // 2. Register administration
    const nextDose = (db.prepare("SELECT COUNT(*) as count FROM administracoes WHERE paciente_id = ? AND vacina_id = ?").get(paciente_id, vacina_id) as any).count + 1;
    
    const info = db.prepare(`
      INSERT INTO administracoes (paciente_id, vacina_id, frasco_id, user_id, numero_dose, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(paciente_id, vacina_id, vial.id, user_id, nextDose, observacoes);

    // 3. Update vial doses
    const newDoses = vial.doses_restantes - 1;
    db.prepare(`
      UPDATE frascos_stock 
      SET doses_restantes = ?, estado = ? 
      WHERE id = ?
    `).run(newDoses, newDoses === 0 ? 'consumido' : 'aberto', vial.id);

    logAction(user_id, "ADMINISTER", "administracoes", Number(info.lastInsertRowid), `Paciente ID: ${paciente_id}, Vacina ID: ${vacina_id}`);
    res.json({ success: true });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", (req, res) => {
    const dosesHoje = db.prepare("SELECT COUNT(*) as count FROM administracoes WHERE data_administracao = date('now')").get() as any;
    const pacientesHoje = db.prepare("SELECT COUNT(DISTINCT paciente_id) as count FROM administracoes WHERE data_administracao = date('now')").get() as any;
    const frascosAbertos = db.prepare("SELECT COUNT(*) as count FROM frascos_stock WHERE estado = 'aberto'").get() as any;
    const stockBaixo = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT vacina_id FROM frascos_stock WHERE estado = 'disponivel' GROUP BY vacina_id HAVING COUNT(*) < 3
      )
    `).get() as any;
    
    res.json({
      dosesHoje: dosesHoje.count,
      pacientesHoje: pacientesHoje.count,
      frascosAbertos: frascosAbertos.count,
      alertasPendentes: stockBaixo.count
    });
  });

  // Backup API
  app.get("/api/system/backup", (req, res) => {
    try {
      const backupPath = path.join(__dirname, "vacina_ja_backup.db");
      db.backup(backupPath)
        .then(() => {
          res.download(backupPath);
        })
        .catch((err) => {
          res.status(500).json({ error: "Erro ao gerar backup" });
        });
    } catch (e) {
      res.status(500).json({ error: "Erro no sistema de backup" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vacina Já Server running on http://localhost:${PORT}`);
  });
}

startServer();
