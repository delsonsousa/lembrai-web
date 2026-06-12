import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  sizes?: string;
  variant?: "ink" | "light";
};

export function BrandLogo({ className, sizes = "160px", variant = "ink" }: BrandLogoProps) {
  return (
    <Image
      alt="Lembraí"
      className={className}
      height={185}
      sizes={sizes}
      src={
        variant === "light"
          ? "/logosLembrai/lembrai-wordmark-light.svg"
          : "/logosLembrai/lembrai-wordmark-ink.svg"
      }
      unoptimized
      width={652}
    />
  );
}
