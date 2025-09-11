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
  <div className="space-y-7 text-center">
    <div className="space-y-4">
      <h1 className="text-4xl font-medium md:text-5xl">{title}</h1>
      <p>{subtitle}</p>
    </div>
    <div className="mx-auto flex w-fit rounded-full bg-[#F3F4F6] p-1 dark:bg-[#222]">
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