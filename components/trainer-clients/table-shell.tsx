"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { TrainerClientRow } from "@/types/trainer-clients.types";
import { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";

type TrainerClientsTableShellProps = {
  rows: TrainerClientRow[];
  isLoading?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddClient?: () => void;
};

const getStatusColor = (status: SubscriptionStatus | null) => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return "default";
    case SubscriptionStatus.EXPIRED:
      return "destructive";
    case SubscriptionStatus.CANCELED:
      return "secondary";
    case SubscriptionStatus.CREATED:
      return "outline";
    default:
      return "secondary";
  }
};

export function TrainerClientsTableShell({
  rows,
  isLoading = false,
  searchValue,
  onSearchChange,
  onAddClient,
}: TrainerClientsTableShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">My Clients</h2>
        <Button onClick={onAddClient}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-9"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-48" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-muted animate-pulse rounded w-16" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No clients found. Start by adding your first client.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Actual data rows
                rows.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/training/clients/${client.id}`}
                        className="hover:underline text-primary"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.plan || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(client.status)}>
                        {client.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {client.joinDate 
                        ? new Date(client.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : "—"
                      }
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 