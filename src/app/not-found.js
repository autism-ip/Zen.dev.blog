import { NotFound } from '@/components/not-found'

export default function NotFoundPage() {
  return <NotFound />
}

export const metadata = { title: 'Page not found', robots: { index: false, follow: true } }
