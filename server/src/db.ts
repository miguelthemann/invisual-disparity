import fs from 'fs';
import path from 'path';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  diagrams: any[];
  activeDiagramId: string;
}

export class DatabaseService {
  private dbPath: string;
  private isUsingSqlite: boolean = false;
  private sqliteDb: any = null;
  private fallbackStorePath: string;

  constructor(dataDir: string = './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'invisual.db');
    this.fallbackStorePath = path.join(dataDir, 'projects_store.json');

    this.initDatabase();
  }

  private initDatabase() {
    try {
      // Try to load Node 22 built-in node:sqlite
      // @ts-ignore
      const sqliteModule = require('node:sqlite');
      if (sqliteModule && sqliteModule.DatabaseSync) {
        this.sqliteDb = new sqliteModule.DatabaseSync(this.dbPath);
        this.sqliteDb.exec(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
        this.isUsingSqlite = true;
        console.log(`[Database] Initialized SQLite database with node:sqlite at ${this.dbPath}`);
        return;
      }
    } catch (e) {
      console.log('[Database] node:sqlite not available, using JSON file store fallback.');
    }

    // Fallback: JSON file store
    if (!fs.existsSync(this.fallbackStorePath)) {
      fs.writeFileSync(this.fallbackStorePath, JSON.stringify([], null, 2), 'utf-8');
    }
    console.log(`[Database] Initialized JSON storage engine at ${this.fallbackStorePath}`);
  }

  public getAllProjects(): ProjectData[] {
    if (this.isUsingSqlite && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT id, name, description, data, created_at, updated_at FROM projects ORDER BY updated_at DESC');
      const rows = stmt.all();
      return rows.map((r: any) => {
        try {
          const parsed = JSON.parse(r.data);
          return {
            ...parsed,
            id: r.id,
            name: r.name,
            description: r.description,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        } catch {
          return {
            id: r.id,
            name: r.name,
            description: r.description,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            diagrams: [],
            activeDiagramId: '',
          };
        }
      });
    }

    // JSON file store
    try {
      const content = fs.readFileSync(this.fallbackStorePath, 'utf-8');
      return JSON.parse(content) as ProjectData[];
    } catch {
      return [];
    }
  }

  public getProject(id: string): ProjectData | null {
    if (!id || typeof id !== 'string') return null;
    if (this.isUsingSqlite && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT id, name, description, data, created_at, updated_at FROM projects WHERE id = ?');
      const row = stmt.get(id);
      if (!row) return null;
      try {
        const parsed = JSON.parse(row.data);
        return {
          ...parsed,
          id: row.id,
          name: row.name,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch {
        return null;
      }
    }

    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  public saveProject(project: ProjectData): void {
    if (!project || !project.id) {
      throw new Error('Project must have a valid id');
    }

    project.name = (project.name && typeof project.name === 'string' ? project.name.trim() : '') || 'Untitled Project';
    project.description = project.description || '';
    if (!Array.isArray(project.diagrams)) {
      project.diagrams = [];
    }
    if (!project.activeDiagramId && project.diagrams.length > 0) {
      project.activeDiagramId = project.diagrams[0].id;
    }

    project.updatedAt = new Date().toISOString();
    if (!project.createdAt) {
      project.createdAt = project.updatedAt;
    }

    if (this.isUsingSqlite && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(`
        INSERT INTO projects (id, name, description, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          data = excluded.data,
          updated_at = excluded.updated_at;
      `);
      stmt.run(
        project.id,
        project.name,
        project.description || '',
        JSON.stringify(project),
        project.createdAt,
        project.updatedAt
      );
      return;
    }

    // JSON file store
    const projects = this.getAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }
    fs.writeFileSync(this.fallbackStorePath, JSON.stringify(projects, null, 2), 'utf-8');
  }

  public deleteProject(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    if (this.isUsingSqlite && this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    }

    let projects = this.getAllProjects();
    const initialLen = projects.length;
    projects = projects.filter(p => p.id !== id);
    if (projects.length !== initialLen) {
      fs.writeFileSync(this.fallbackStorePath, JSON.stringify(projects, null, 2), 'utf-8');
      return true;
    }
    return false;
  }

  public seedIfEmpty(sampleProject: ProjectData): void {
    const list = this.getAllProjects();
    if (list.length === 0) {
      console.log('[Database] Empty project database detected. Seeding sample project...');
      this.saveProject(sampleProject);
    }
  }
}
