import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configurar servidor de mocks para testes
export const server = setupServer(...handlers); 