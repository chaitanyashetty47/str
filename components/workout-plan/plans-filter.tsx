"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TrainerClient } from "@/types/trainerclients.types";

interface PlansFilterProps {
  clients: TrainerClient[];
}

export function PlansFilter({ clients }: PlansFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current filter values from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedClient, setSelectedClient] = useState(searchParams.get("client") || "all");
  const [status, setStatus] = useState(searchParams.get("status") || "all");

  // Memoize the updateFilters function to avoid re-creating it on every render
  const updateFilters = useCallback(() => {
    // Create a new URLSearchParams object based on the current URL
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove the query parameter
    if (searchQuery) {
      params.set("query", searchQuery);
    } else {
      params.delete("query");
    }
    
    // Update or remove the client parameter
    if (selectedClient !== "all") {
      params.set("client", selectedClient);
    } else {
      params.delete("client");
    }
    
    // Update or remove the status parameter
    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    
    // Update the URL with the new parameters
    router.push(`/training/plans?${params.toString()}`);
  }, [searchQuery, selectedClient, status, searchParams, router]);

  // Handle search input submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  // Update when dropdown selections change
  useEffect(() => {
    updateFilters();
  }, [selectedClient, status, updateFilters]);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search by plan name */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <Label htmlFor="search-plans" className="sr-only">Search plans</Label>
              <Input
                id="search-plans"
                placeholder="Search plan name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-10 w-10"
              >
                <SearchIcon className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Filter by client */}
          <div className="w-full md:w-64">
            <Label htmlFor="client-filter" className="sr-only">Filter by client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger id="client-filter" className="w-full">
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client?.name || client.client?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filter by status (active/previous) */}
          <div className="w-full md:w-auto">
            <Tabs value={status} onValueChange={setStatus} className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-3">
                <TabsTrigger value="all">All Plans</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="previous">Previous</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 