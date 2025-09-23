"use client";
import { Tab } from "@/components/ui/tab";

interface BillingOption {
  label: string;
  value: number;
  discount?: number;
}

export const PricingHeader = ({
  title,
  subtitle,
  options,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  options: BillingOption[];
  selected: number;
  onSelect: (value: number) => void;
}) => (
  <div className="space-y-4 sm:space-y-6 lg:space-y-7 text-center px-4 sm:px-6 lg:px-0">
    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">{title}</h1>
      <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">{subtitle}</p>
    </div>
    <div className="mx-auto flex w-full max-w-sm sm:max-w-md lg:w-auto lg:max-w-lg rounded-full bg-[#F3F4F6] p-0.5 sm:p-1 dark:bg-[#222]">
      {options.map((opt) => (
        <Tab
          key={opt.value}
          text={opt.label}
          value={opt.value}
          selected={selected === opt.value}
          setSelected={onSelect}
          discount={opt.discount}
        />
      ))}
    </div>
  </div>
);