import {
  Eye,
  Flower2,
  Hand,
  HelpCircle,
  Scissors,
  Slice,
  Sparkles,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  hair: Scissors,
  nails: Hand,
  makeup: Sparkles,
  skincare: Flower2,
  massage: Waves,
  "brows-lashes": Eye,
  barbering: Slice,
};

export function CategoryIcon({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const Icon = ICONS[value] ?? HelpCircle;
  return <Icon className={cn("size-4", className)} />;
}

export function CategoryTile({
  value,
  color,
  className,
}: {
  value: string;
  color: string;
  className?: string;
}) {
  const Icon = ICONS[value] ?? HelpCircle;
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-xl",
        className,
      )}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon className="size-4.5" />
    </span>
  );
}
