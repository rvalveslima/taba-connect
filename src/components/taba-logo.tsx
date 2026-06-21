import logoAsset from "@/assets/taba-logo.png.asset.json";

export function TabaLogo({
  className = "",
  height = 24,
  alt = "Taba",
}: {
  className?: string;
  height?: number;
  alt?: string;
}) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      height={height}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}
