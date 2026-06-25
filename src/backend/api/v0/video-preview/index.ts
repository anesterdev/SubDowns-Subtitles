import { OpenAPIHono } from '@hono/zod-openapi';
import { route, handler } from './GET.ts';

const app = new OpenAPIHono();

app.openapi(route, handler);

export default app;
