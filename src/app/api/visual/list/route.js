import { apiError, apiHandler } from '@/lib/agent/http'
import { getVisualMedia } from '@/lib/visual-media'

async function handle() {
  try {
    return Response.json({ ok: true, media: await getVisualMedia() })
  } catch {
    return apiError({
      code: 'upstream_unavailable',
      message: 'Failed to fetch visual media',
      hint: 'The media library is temporarily unreachable; retry later',
      status: 500
    })
  }
}
export const GET = apiHandler(handle)
