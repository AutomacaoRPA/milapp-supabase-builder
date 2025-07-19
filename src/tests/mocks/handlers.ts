import { http, HttpResponse } from 'msw';

// Dados mock para projetos
const mockProjects = [
  {
    id: "1",
    name: "Automação de Faturamento",
    description: "Automação do processo de faturamento mensal",
    status: "desenvolvimento",
    priority: 4,
    methodology: "scrum",
    complexity_score: 7,
    estimated_roi: 50000,
    actual_roi: null,
    start_date: "2024-01-15",
    target_date: "2024-03-15",
    completed_date: null,
    created_by: "user-1",
    assigned_architect: "architect-1",
    product_owner: "po-1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T14:30:00Z"
  },
  {
    id: "2",
    name: "Processamento de Notas Fiscais",
    description: "Automação da leitura e processamento de NF-e",
    status: "ideacao",
    priority: 3,
    methodology: "kanban",
    complexity_score: 5,
    estimated_roi: 30000,
    actual_roi: null,
    start_date: null,
    target_date: "2024-04-30",
    completed_date: null,
    created_by: "user-2",
    assigned_architect: null,
    product_owner: "po-2",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z"
  }
];

// Handlers para APIs
export const handlers = [
  // GET /projects
  http.get('*/projects', () => {
    return HttpResponse.json(mockProjects);
  }),

  // POST /projects
  http.post('*/projects', async ({ request }) => {
    const newProject = await request.json();
    const createdProject = {
      ...newProject,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return HttpResponse.json(createdProject);
  }),

  // PUT /projects/:id
  http.put('*/projects/:id', async ({ request }) => {
    const updates = await request.json();
    return HttpResponse.json({ success: true, data: updates });
  }),

  // DELETE /projects/:id
  http.delete('*/projects/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock para Supabase
  http.get('*/supabase.co/rest/v1/projects*', () => {
    return HttpResponse.json(mockProjects);
  }),

  http.post('*/supabase.co/rest/v1/projects', async ({ request }) => {
    const newProject = await request.json();
    const createdProject = {
      ...newProject,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return HttpResponse.json(createdProject);
  }),

  http.put('*/supabase.co/rest/v1/projects*', async ({ request }) => {
    const updates = await request.json();
    return HttpResponse.json({ success: true, data: updates });
  }),

  http.delete('*/supabase.co/rest/v1/projects*', () => {
    return HttpResponse.json({ success: true });
  }),
]; 