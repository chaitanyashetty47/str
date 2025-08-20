"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminClient, SubscriptionCategory } from "@/types/admin-client";
import { Plus, Edit } from "lucide-react";
import { useMemo } from "react";

interface UseAdminClientColumnsProps {
  onAssignTrainer: (client: AdminClient, category: SubscriptionCategory) => void;
  onEditClient: (client: AdminClient) => void;
}

export const categoryColors: Record<string, string> = {
  FITNESS: "bg-blue-100 text-blue-800",
  PSYCHOLOGY: "bg-purple-100 text-purple-800",
  MANIFESTATION: "bg-green-100 text-green-800",
  ALL_IN_ONE: "bg-orange-100 text-orange-800",
};

export const useAdminClientColumns = ({ 
  onAssignTrainer, 
  onEditClient 
}: UseAdminClientColumnsProps): ColumnDef<AdminClient>[] => {
  return useMemo(() => [
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "activePlans",
      header: "Active Plan(s)",
      cell: ({ row }) => {
        const plans = row.original.activePlans;
        if (plans.length === 0) {
          return <span className="text-muted-foreground text-sm">No active plans</span>;
        }
        
        return (
          <div className="flex flex-col gap-1">
            {plans.map((plan) => (
              <Badge 
                key={plan.id} 
                className={categoryColors[plan.category] || "bg-gray-100 text-gray-800"}
                variant="secondary"
              >
                {plan.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "fitnessTrainer",
      header: "Fitness Trainer",
      cell: ({ row }) => {
        const client = row.original;
        const fitnessTrainer = client.trainerAssignments.fitness;
        const hasFitnessOrAllInOne = client.activePlans.some(plan => 
          plan.category === 'FITNESS' || plan.category === 'ALL_IN_ONE'
        );

        if (!hasFitnessOrAllInOne) {
          return <span className="text-muted-foreground">-</span>;
        }

        if (fitnessTrainer) {
          return (
            <div className="text-sm">
              <div className="font-medium">{fitnessTrainer.trainerName}</div>
              <div className="text-muted-foreground">{fitnessTrainer.trainerEmail}</div>
            </div>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            onClick={() => onAssignTrainer(client, 'FITNESS')}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        );
      },
    },
    {
      id: "psychologyTrainer",
      header: "Psychology Trainer",
      cell: ({ row }) => {
        const client = row.original;
        const psychologyTrainer = client.trainerAssignments.psychology;
        const hasPsychologyOrAllInOne = client.activePlans.some(plan => 
          plan.category === 'PSYCHOLOGY' || plan.category === 'ALL_IN_ONE'
        );

        if (!hasPsychologyOrAllInOne) {
          return <span className="text-muted-foreground">-</span>;
        }

        if (psychologyTrainer) {
          return (
            <div className="text-sm">
              <div className="font-medium">{psychologyTrainer.trainerName}</div>
              <div className="text-muted-foreground">{psychologyTrainer.trainerEmail}</div>
            </div>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            onClick={() => onAssignTrainer(client, 'PSYCHOLOGY')}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        );
      },
    },
    {
      id: "manifestationTrainer",
      header: "Manifestation Trainer",
      cell: ({ row }) => {
        const client = row.original;
        const manifestationTrainer = client.trainerAssignments.manifestation;
        const hasManifestationOrAllInOne = client.activePlans.some(plan => 
          plan.category === 'MANIFESTATION' || plan.category === 'ALL_IN_ONE'
        );

        if (!hasManifestationOrAllInOne) {
          return <span className="text-muted-foreground">-</span>;
        }

        if (manifestationTrainer) {
          return (
            <div className="text-sm">
              <div className="font-medium">{manifestationTrainer.trainerName}</div>
              <div className="text-muted-foreground">{manifestationTrainer.trainerEmail}</div>
            </div>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            onClick={() => onAssignTrainer(client, 'MANIFESTATION')}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => onEditClient(row.original)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ], [onAssignTrainer, onEditClient]);
};
