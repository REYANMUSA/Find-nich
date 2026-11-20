import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  onError?: () => void;
}

/**
 * Serves responsive WebP variants (-400.webp / .webp) for local catalog images in /images/
 * while preserving the original .jpg/.png/uploaded URL as fallback with zero broken images.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  sizes = '(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 280px',
  className = '',
  onError,
}) => {
  const isLocalOptimized = src.startsWith('/images/') && src.endsWith('.jpg');
  const basePath = isLocalOptimized ? src.slice(0, -4) : null;

  const imgProps = {
    src,
    alt,
    width,
    height,
    loading: (priority ? 'eager' : 'lazy') as 'eager' | 'lazy',
    decoding: 'async' as const,
    fetchPriority: (priority ? 'high' : 'auto') as 'high' | 'auto',
    referrerPolicy: 'no-referrer' as const,
    onError,
    className,
  };

  if (basePath) {
    return (
      <picture className="block w-full h-full">
        <source
          type="image/webp"
          srcSet={`${basePath}-400.webp 400w, ${basePath}.webp 800w`}
          sizes={sizes}
        />
        <img {...imgProps} />
      </picture>
    );
  }

  return <img {...imgProps} />;
};
