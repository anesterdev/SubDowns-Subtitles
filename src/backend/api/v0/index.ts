import { OpenAPIHono } from '@hono/zod-openapi';
import videoPreviewRouter from './video-preview/index.ts';
import downloadRouter from './download/index.ts';

const router = new OpenAPIHono();

router.route('/video-preview', videoPreviewRouter);
router.route('/download', downloadRouter);

export default router;
