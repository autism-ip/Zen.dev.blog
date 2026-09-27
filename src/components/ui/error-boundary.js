'use client'

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

export function ErrorBoundary({ children, fallback }) {
  return (
    <ReactErrorBoundary
      fallbackRender={
        fallback
          ? () => fallback
          : ({ resetErrorBoundary }) => (
              <div
                className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white"
                role="alert"
              >
                <meta name="robots" content="noindex" />
                <h2 className="text-2xl font-bold">Oops! Something went wrong.</h2>
                <p className="mt-2 text-gray-400">An unexpected error occurred. Please try again.</p>
                <button
                  onClick={resetErrorBoundary}
                  className="mt-6 rounded-md bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                >
                  Try again
                </button>
              </div>
            )
      }
    >
      {children}
    </ReactErrorBoundary>
  )
}
