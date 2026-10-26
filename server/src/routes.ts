import { Router, Request, Response } from 'express';
import { DatabaseService, ProjectData } from './db.js';
import { DEFAULT_SAMPLE_PROJECT } from './sampleProject.js';

export function createApiRouter(db: DatabaseService): Router {
  const router = Router();

  // List all projects
  router.get('/projects', (req: Request, res: Response) => {
    try {
      const projects = db.getAllProjects();
      const summaries = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        diagramCount: p.diagrams?.length || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
      res.json(summaries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new project
  router.post('/projects', (req: Request, res: Response) => {
    try {
      const rawName = req.body?.name;
      const rawDesc = req.body?.description;
      const name = (typeof rawName === 'string' ? rawName.trim() : '') || 'Untitled Project';
      const description = (typeof rawDesc === 'string' ? rawDesc.trim() : '') || 'Visual software architecture and data modeling project';

      const newId = 'proj_' + Math.random().toString(36).substring(2, 9);
      const initialDiagramId = 'diag_main';

      const newProject: ProjectData = {
        id: newId,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeDiagramId: initialDiagramId,
        diagrams: [
          {
            id: initialDiagramId,
            name: 'Class Diagram',
            type: 'class',
            description: 'Domain model architecture',
            zoom: 1,
            pan: { x: 50, y: 50 },
            nodes: [],
            edges: [],
          },
        ],
      };

      db.saveProject(newProject);
      res.status(201).json(newProject);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single project
  router.get('/projects/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      const project = db.getProject(id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update / auto-save project
  router.put('/projects/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required in URL path' });
      }
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid project payload: body must be a JSON object' });
      }
      const projectData: ProjectData = req.body;
      projectData.id = id;
      projectData.name = (typeof projectData.name === 'string' ? projectData.name.trim() : '') || 'Untitled Project';
      if (!Array.isArray(projectData.diagrams)) {
        projectData.diagrams = [];
      }

      db.saveProject(projectData);
      res.json({ success: true, updatedAt: projectData.updatedAt });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete project
  router.delete('/projects/:id', (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }
      const success = db.deleteProject(id);
      if (!success) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import project
  router.post('/projects/import', (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid project payload: body must be a JSON object' });
      }
      const projectData: ProjectData = req.body;
      if (!projectData.name || typeof projectData.name !== 'string' || !Array.isArray(projectData.diagrams)) {
        return res.status(400).json({ error: 'Invalid project format: name and diagrams array are required' });
      }
      // Assign new id to avoid collisions
      projectData.id = 'proj_' + Math.random().toString(36).substring(2, 9);
      projectData.updatedAt = new Date().toISOString();
      db.saveProject(projectData);
      res.status(201).json(projectData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset to sample project
  router.post('/projects/reset-sample', (req: Request, res: Response) => {
    try {
      const freshSample = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_PROJECT));
      freshSample.id = 'proj_' + Math.random().toString(36).substring(2, 9);
      freshSample.updatedAt = new Date().toISOString();
      db.saveProject(freshSample);
      res.json(freshSample);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Healthcheck
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'invisual-disparity',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  return router;
}
