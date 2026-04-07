import Link from 'next/link'

import { VinylPlayer } from '@/components/vinyl-player'
import { NavigationLink } from '@/components/navigation-link'
import { LINKS, PROFILES } from '@/lib/constants'
import { UsersIcon } from 'lucide-react'

export const MenuContent = () => (
  <div className="flex w-full flex-col text-sm">
    <div className="flex flex-col gap-4">
      <Link href="/" className="link-card inline-flex items-center gap-2 p-2">
        <img
          src="/assets/dp.jpg"
          alt="Zen"
          width={40}
          height={40}
          loading="eager"
          className="rounded-full border shadow-xs"
          // eslint-disable-next-line react/no-unknown-property
          nopin="nopin"
        />
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight">Zen</span>
          <span className="text-gray-600">Open Source enthusiasts</span>
        </div>
      </Link>
      <div className="flex flex-col gap-2">
        {LINKS.map((link, linkIndex) => (
          <NavigationLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            shortcutNumber={linkIndex + 1}
          />
        ))}
      </div>
    </div>
    <VinylPlayer />
    <hr />
    <div className="flex flex-col gap-2 text-sm">
      <span className="px-2 text-xs leading-relaxed font-medium text-gray-600">Online</span>
      <div className="flex flex-col gap-2">
        {Object.values(PROFILES).map((profile) => (
          <NavigationLink key={profile.url} href={profile.url} label={profile.title} icon={profile.icon} />
        ))}
      </div>
    </div>
  </div>
)
