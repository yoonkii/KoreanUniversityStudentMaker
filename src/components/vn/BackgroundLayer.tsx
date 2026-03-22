import Image from 'next/image';

interface BackgroundLayerProps {
  location: string;
  variant: string;
}

export default function BackgroundLayer({ location, variant }: BackgroundLayerProps) {
  const src = `/assets/backgrounds/${location}/${variant}.png`;

  return (
    <div className="absolute inset-0 z-0">
      <Image
        src={src}
        alt={`${location} - ${variant}`}
        fill
        priority
        className="object-cover w-full h-full"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}
