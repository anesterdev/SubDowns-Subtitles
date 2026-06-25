import { OpenAPIHono } from '@hono/zod-openapi';
import videoPreviewRouter from './video-preview/index.ts';
import { route as downloadRoute, handler as downloadHandler } from './download/GET.ts';
import { route as rawRoute, handler as rawHandler } from './download/raw/GET.ts';

const router = new OpenAPIHono();

router.route('/video-preview', videoPreviewRouter);
router.openapi(downloadRoute, downloadHandler);
router.openapi(rawRoute, rawHandler);

export default router;
