import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  sizes?: string;
};

export function BrandLogo({ className, sizes = "160px" }: BrandLogoProps) {
  return (
    <Image
      alt="Lembraí"
      className={className}
      height={399}
      sizes={sizes}
      src="/logo-lembrai-cropped.png"
      width={1066}
    />
  );
}
