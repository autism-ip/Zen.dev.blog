import { isbot } from 'isbot'
import { NextResponse } from 'next/server'

import { formSchema } from '@/components/submit-bookmark/utils'
import { apiError, apiHandler } from '@/lib/agent/http'

async function handle(req) {
  const json = await req.json()
  const data = await formSchema.safeParse(json)
  if (!data.success) {
    return apiError({
      code: 'invalid_submission',
      message: 'Invalid submission payload',
      hint: 'Provide url (absolute URI) and email (valid address); the full schema is in /openapi.json',
      status: 400
    })
  }

  if (isbot(req.headers.get('User-Agent'))) {
    return apiError({
      code: 'bots_not_allowed',
      message: 'Bots are not allowed.',
      hint: 'This endpoint serves the human form at /bookmarks; use the read-only public API instead',
      status: 403
    })
  }

  try {
    const { url, email, type } = data.data

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_BOOKMARKS_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          fields: {
            URL: url,
            Email: email,
            Date: new Date().toISOString(),
            Type: type || 'Other'
          }
        })
      }
    )

    if (!response.ok) throw new Error('Submission upstream failed')
    const res = await response.json()
    return NextResponse.json({ res })
  } catch (error) {
    console.info(error)
    return apiError({
      code: 'upstream_error',
      message: 'Error submitting bookmark.',
      hint: 'The submission store is temporarily unreachable; retry later',
      status: 500
    })
  }
}

export const POST = apiHandler(handle, { jsonObject: true })
