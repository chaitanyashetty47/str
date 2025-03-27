'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchPlansProps {
  defaultValue?: string;
}

export function SearchPlans({ defaultValue }: SearchPlansProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <form>
        <Input 
          name="query"
          placeholder="Search plan name..." 
          className="pl-10"
          defaultValue={defaultValue}
          onChange={(e) => {
            const form = e.target.form;
            if (form) {
              form.requestSubmit();
            }
          }}
        />
      </form>
    </div>
  );
} 