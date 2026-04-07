import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Visual - Photography & AI Generated Art'
export const size = {
  width: 1200,
  height: 630
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        className="flex h-full w-full flex-col items-center justify-center bg-black"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
          backgroundSize: '100px 100px'
        }}
      >
        <div className="flex flex-col items-center justify-center text-center text-white">
          <h1
            className="mb-6 bg-clip-text text-[72px] font-bold text-transparent"
            style={{
              background: 'linear-gradient(45deg, #ffffff, #888888)'
            }}
          >
            Visual Explorer
          </h1>
          <p className="m-0 max-w-[800px] text-[32px] text-[#cccccc]">Photography & AI Generated Art Collection</p>
        </div>
      </div>
    ),
    {
      ...size
    }
  )
}
