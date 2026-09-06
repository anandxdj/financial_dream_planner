import React from "react";
import Image from "next/image";
import { getAsset, type AssetMetadata } from "@/lib/assets";
import { cn } from "@/lib/utils";

export interface AssetImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | AssetMetadata;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  sizes?: string;
}

export function AssetImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  decorative,
  sizes,
  ...rest
}: AssetImageProps) {
  const assetMeta: AssetMetadata | undefined =
    typeof src === "string" ? getAsset(src) : src;

  const imageSrc = typeof src === "string" ? src : src.path;
  const isDeco = decorative ?? (assetMeta ? assetMeta.isDecorative : false);
  const resolvedAlt = isDeco ? "" : alt || assetMeta?.alt || "Financial Dream Planner illustration";

  const resolvedWidth = width ?? assetMeta?.width ?? 400;
  const resolvedHeight = height ?? assetMeta?.height ?? 300;

  return (
    <Image
      src={imageSrc}
      alt={resolvedAlt}
      width={resolvedWidth}
      height={resolvedHeight}
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 440px"}
      aria-hidden={isDeco ? "true" : undefined}
      className={cn("h-auto max-w-full object-contain", className)}
      {...rest}
    />
  );
}
