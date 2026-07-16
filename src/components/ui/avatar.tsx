import { avatarStyles, cn, initials } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
  xl: "size-16 text-lg",
} as const;

export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
        sizes[size],
        className,
      )}
      style={avatarStyles(hue)}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
