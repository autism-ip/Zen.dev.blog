'use client'

/**
 * [INPUT]: Next.js route errors and reset callback
 * [OUTPUT]: Recoverable, non-indexable error UI without exception details
 * [POS]: Protects content routes from exposing application error text to crawlers
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export default function ErrorPage({ reset }) {
  return (
    <div className="content-wrapper">
      <meta name="robots" content="noindex" />
      <div className="content" role="alert">
        <h1>Content temporarily unavailable</h1>
        <p>Please try again shortly.</p>
        <button onClick={reset} className="link mt-4">
          Try again
        </button>
      </div>
    </div>
  )
}
