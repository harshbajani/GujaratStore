import Image from "next/image";
import { useState } from "react";

interface BlogImageProps {
  imageId: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export function BlogImage({
  imageId,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
}: BlogImageProps) {
  const [error, setError] = useState(false);

  if (!imageId || error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: fill ? "100%" : width, height: fill ? "100%" : height }}
      >
        <span className="text-gray-400">No image</span>
      </div>
    );
  }

  return (
    <Image
      src={`/api/files/${imageId}`}
      alt={alt}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      fill={fill}
      className={className}
      onError={() => setError(true)}
      priority={priority}
    />
  );
}
