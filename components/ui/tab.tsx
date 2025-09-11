import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Badge } from "./badge";
import { number } from "zod";

interface TabProps {
  text: string;
  value: number;
  selected: boolean;
  setSelected: (value: number) => void;
  discount?: number;
}

export const Tab = ({
  text,
  selected,
  value,
  setSelected,
  discount,
}: TabProps) => {
  return (
    <button
      onClick={() => setSelected(value)}
      className={cn(
        "relative w-fit px-4 py-2 text-sm font-semibold capitalize text-foreground transition-colors focus:outline-none focus:ring-0",
        discount && "flex items-center justify-center gap-2.5",
      )}
    >
      <span className={cn("relative z-10", selected && "text-white")}>{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="absolute inset-0 z-0 rounded-full bg-primary shadow-sm"
        ></motion.span>
      )}
      {discount && (
        <Badge
          className={cn(
            "relative z-10 whitespace-nowrap text-xs shadow-none",
            selected
              ? "bg-white/20 text-white hover:bg-white/20"
              : "bg-green-100 text-green-700 hover:bg-green-100",
          )}
        >
          Save {discount}%
        </Badge>
      )}
    </button>
  );
};