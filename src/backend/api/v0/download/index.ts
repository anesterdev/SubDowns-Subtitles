import { OpenAPIHono } from '@hono/zod-openapi';
import { route as getRoute, handler as getHandler } from './GET.ts';
import { route as rawRoute, handler as rawHandler } from './raw/GET.ts';

const router = new OpenAPIHono();

router.openapi(getRoute, getHandler);
router.openapi(rawRoute, rawHandler);

export default router;
