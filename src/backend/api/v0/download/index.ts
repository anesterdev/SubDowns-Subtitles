import { OpenAPIHono } from '@hono/zod-openapi';
import { route as getRoute, handler as getHandler } from './GET.ts';

const router = new OpenAPIHono();

router.openapi(getRoute, getHandler);

export default router;
