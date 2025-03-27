'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatusTabsProps {
  defaultValue?: string;
}

export function StatusTabs({ defaultValue }: StatusTabsProps) {
  return (
    <Tabs 
      defaultValue={defaultValue || 'all'} 
      className="w-full"
      onValueChange={(value) => {
        const url = new URL(window.location.href);
        if (value === 'all') {
          url.searchParams.delete('status');
        } else {
          url.searchParams.set('status', value);
        }
        window.location.href = url.toString();
      }}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All Plans</TabsTrigger>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="previous">Previous</TabsTrigger>
      </TabsList>
    </Tabs>
  );
} 