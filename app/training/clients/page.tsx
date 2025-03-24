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

const clients = [
  {
    name: "Alex Johnson",
    email: "alex.j@example.com",
    plan: "Premium",
    status: "Active",
    progress: "On Track",
    joinDate: "Jan 15, 2024",
  },
  {
    name: "Maria Garcia",
    email: "maria.g@example.com",
    plan: "Standard",
    status: "Active",
    progress: "Behind",
    joinDate: "Feb 1, 2024",
  },
  {
    name: "Sam Wilson",
    email: "sam.w@example.com",
    plan: "Premium",
    status: "Active",
    progress: "Ahead",
    joinDate: "Dec 10, 2023",
  },
  {
    name: "Emily Chen",
    email: "emily.c@example.com",
    plan: "Standard",
    status: "Inactive",
    progress: "On Hold",
    joinDate: "Mar 1, 2024",
  },
  {
    name: "Raj Patel",
    email: "raj.p@example.com",
    plan: "Premium",
    status: "Active",
    progress: "On Track",
    joinDate: "Jan 20, 2024",
  },
];

const getProgressColor = (progress: string) => {
  switch (progress) {
    case "Ahead":
      return "bg-green-500";
    case "On Track":
      return "bg-blue-500";
    case "Behind":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "success";
    case "Inactive":
      return "secondary";
    default:
      return "default";
  }
};

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">My Clients</h2>
        <Button>
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
                <TableHead>Progress</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.email}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.plan}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(client.status) as any}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${getProgressColor(
                          client.progress
                        )}`}
                      />
                      {client.progress}
                    </div>
                  </TableCell>
                  <TableCell>{client.joinDate}</TableCell>
                  <TableCell>
                    <Button variant="link" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 