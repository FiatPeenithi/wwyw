import Image from 'next/image'
import React from 'react'
import { driveImageUrl } from '../lib/drive-image'

type Props = {
  name: string
  short: string
  thumbnail: string
}

function ListItem({ name, short, thumbnail }: Props) {
  return (
    <div
      className="
        flex items-center gap-8
        p-3 sm:p-4
        bg-white
      "
      aria-label={name}
    >
      {/* Avatar wrapper (mobile-first sizes) */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
        <Image
          src={driveImageUrl(thumbnail, { useThumbnail: true, size: 'w512' })}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
          priority={false}
        />
      </div>

      {/* Texts (truncate nicely on small screens) */}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-medium">
          {name}
        </p>
        <p className="mt-0.5 text-sm sm:text-base text-zinc-600 line-clamp-2 sm:line-clamp-1">
          {short}
        </p>
      </div>
    </div>
  )
}

export default ListItem
