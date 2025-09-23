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
        "relative flex-1 sm:w-fit px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-semibold capitalize text-foreground transition-colors focus:outline-none focus:ring-0",
        discount && "flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2.5",
      )}
    >
      <span className={cn("relative z-10 truncate", selected && "text-white")}>{text}</span>
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
            "relative z-10 whitespace-nowrap text-[10px] sm:text-xs shadow-none px-1 sm:px-2 py-0.5 min-w-0 flex-shrink-0",
            selected
              ? "bg-white/20 text-white hover:bg-white/20"
              : "bg-green-100 text-green-700 hover:bg-green-100",
          )}
        >
          <span className="hidden sm:inline">Save&nbsp;</span><span className="sm:hidden">{discount}%</span><span className="hidden sm:inline"> &nbsp;{discount}%</span>
        </Badge>
      )}
    </button>
  );
};