# Invisual Disparity

> **A self-hostable, Docker-deployable visual modeling suite for software architecture, UML diagrams, and database design.**

[![Docker Deployable](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](file:///home/miguel/invisual-disparity/docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](file:///home/miguel/invisual-disparity/server)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](file:///home/miguel/invisual-disparity/client)
[![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57?logo=sqlite&logoColor=white)](file:///home/miguel/invisual-disparity/server/src/db.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](file:///home/miguel/invisual-disparity/LICENSE)

---

## 🎯 Propósito & Funcionalidades (Core Features)

O **Invisual Disparity** é uma suite de modelação visual e engenharia de software concebida para ser moderna, ultra-rápida, leve e 100% self-hosted em Docker:

1. **Modelagem de Software & Arquitetura**:
   - **Diagramas de Classes UML**: Classes completas com estereótipos (`<<interface>>`, `<<entity>>`, `<<service>>`, `<<aggregate>>`), modificadores de visibilidade (`+` público, `-` privado, `#` protegido, `~` pacote), tipagem de atributos e assinaturas de métodos.
   - **Diagramas de Entidade-Relacionamento (ERD)**: Tabelas relacionais com chaves primárias (PK), chaves estrangeiras (FK), tipos SQL (`UUID`, `VARCHAR`, `TIMESTAMP`, `DECIMAL`, etc.), restrições (`NOT NULL`, `UNIQUE`) e cardinalidade **Crow's Foot** (`1 : N`, `1 : 1`, `N : M`).
   - **Diagramas de Sequência UML**: Linhas de vida de participantes (*lifelines*), mensagens síncronas (`──▶`), assíncronas (`──>`), retornos tracejados (`- - >`) e ordenação sequencial automática.
   - **Diagramas de Casos de Uso**: Atores do sistema, balões de casos de uso, fronteiras de subsistema (*System Boundary*) e relacionamentos `<<include>>` / `<<extend>>`.
   - **Model Explorer & Dicionário de Dados**: Navegador em árvore com todos os elementos modelados através de múltiplos diagramas no mesmo projeto.

2. **Engenharia & Geração de Código / DDL Automática**:
   - **Gerador de DDL SQL**: Converte diagramas ERD em código SQL válido para **PostgreSQL**, **MySQL**, **SQLite** e **Oracle**, incluindo `CREATE TABLE`, `PRIMARY KEY`, tipos mapeados e `CONSTRAINT FOREIGN KEY ... REFERENCES`.
   - **Gerador de Código Multi-Linguagem**: Transforma o seu diagrama de classes em código pronto para produção em:
     - **TypeScript / JavaScript** (classes, interfaces, tipos, construtores e métodos)
     - **Python 3** (`@dataclass`, anotações de tipo `typing`, `Enum` e métodos)
     - **Java** (`public class`, atributos privados, getters/setters encapsulados, `extends` e `implements`)
     - **Go** (`structs` com tags JSON, métodos e interfaces)
     - **C# / .NET** (classes com propriedades `{ get; set; }`, construtores e herança)
   - **Exportação para Mermaid & PlantUML**: Geração instantânea de sintaxe Markdown para incorporar diretamente em documentação, GitHub, GitLab ou Notion.
   - **Exportação Gráfica**: Download do diagrama em formato vetorial **SVG** e backup completo em formato **JSON**.

---

## 🚀 Quick Start (Docker Compose)

O deployment é instantâneo via Docker Compose, com persistência automática de base de dados SQLite:

```bash
# Iniciar o container em background
docker compose up -d
```

Abra o seu navegador em:
👉 **[http://localhost:8090](http://localhost:8090)**

---

## 🛠️ Configuração & Variáveis de Ambiente

Crie ou edite o seu `.env` se desejar alterar a porta ou a pasta de dados:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `8090` | Porta HTTP exposta pelo container |
| `DATA_DIR` | `/app/data` | Diretoria interna onde fica a base de dados SQLite (`invisual.db`) |
| `NODE_ENV` | `production` | Ambiente de execução |

### Persistência de Dados
O volume mapeado no `docker-compose.yml` (`./data:/app/data`) garante que todos os seus diagramas, projetos e revisões permaneçam guardados na base de dados SQLite mesmo após reiniciar ou atualizar o container.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
| :--- | :--- |
| **Ctrl + Z** / **Cmd + Z** | Desfazer (*Undo*) |
| **Ctrl + Y** / **Cmd + Shift + Z** | Refazer (*Redo*) |
| **Ctrl + S** | Guardar alterações (*Autosave ativo por padrão*) |
| **Delete** / **Backspace** | Eliminar elemento ou ligação selecionada |
| **Espaço + Arrastar** / **Roda do Rato** | Mover canvas (*Pan*) |
| **Scroll do Rato** | Zoom In / Zoom Out (20% a 300%) |
| **Escape** | Limpar seleção |

---

## 🏗️ Estrutura do Projeto

```
invisual-disparity/
├── client/                      # Frontend SPA (React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/         # Canvas interativo, ToolPalette, Navbar, Sidebar
│   │   ├── context/            # Gestão de estado do projeto e histórico (Undo/Redo)
│   │   ├── types/              # Definições UML, ERD, Nodes e Edges
│   │   └── utils/              # Geradores de DDL SQL, Code Gen, PlantUML e rotas SVG
├── server/                      # Backend API (Node.js Express + SQLite nativo)
│   ├── src/
│   │   ├── db.ts               # Camada de persistência SQLite com fallback seguro
│   │   ├── routes.ts           # API REST para projetos, diagramas e import/export
│   │   └── sampleProject.ts    # Seed com arquitetura e-commerce demonstrativa
├── docker-compose.yml           # Definição pronta para deploy
├── Dockerfile                   # Build multi-stage otimizado em Alpine Linux
└── docker-entrypoint.sh         # Gestor de permissões e arranque seguro
```

---

## 📦 Desenvolvimento Local (sem Docker)

Caso prefira executar sem Docker na sua máquina:

```bash
# 1. Instalar e compilar client
cd client && npm install && npm run build

# 2. Instalar e compilar server
cd ../server && npm install && npm run build

# 3. Iniciar o servidor (Node 22+)
npm start
```

---

## 📄 Licença
Distribuído sob a licença [MIT](file:///home/miguel/invisual-disparity/LICENSE).
