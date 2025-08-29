"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { NewlyAssignedClient } from "@/types/trainer.dashboard";
import { formatDistanceToNow } from "date-fns";

interface NewlyAssignedClientsCardProps {
  clients: NewlyAssignedClient[];
}

export function NewlyAssignedClientsCard({ clients }: NewlyAssignedClientsCardProps) {
  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "FITNESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PSYCHOLOGY":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MANIFESTATION":
        return "bg-green-100 text-green-800 border-green-200";
      case "ALL_IN_ONE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">Newly Added Clients</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clients who need workout plans assigned
          </p>
        </div>
        <Link href="/fitness/plans/create">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {clients.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{client.clientName}</p>
                      {client.category && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(client.category)}`}
                        >
                          {client.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{client.clientEmail}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Assigned {formatDistanceToNow(new Date(client.assignedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href={`/fitness/plans/create?clientId=${client.clientId}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-3 w-3" />
                      Create Plan
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All clients have plans!
            </h3>
            <p className="text-gray-500 mb-4">
              Great job! All your newly assigned clients already have active or future workout plans.
            </p>
            <Link href="/fitness/plans/create">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create New Plan
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
