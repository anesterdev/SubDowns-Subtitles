import { OpenAPIHono } from '@hono/zod-openapi';
import v0Router from './v0/index.ts';

const api = new OpenAPIHono();

api.route('/v0', v0Router);

export default api;
