"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Plus, Users } from "lucide-react";
import { AssignTrainerModal } from "@/components/admin/assign-trainer-modal";
import { AllInOneTrainerModal } from "@/components/admin/all-in-one-trainer-modal";
import { type RecentSubscription } from "@/actions/admin/admin.dashboard.action";

interface RecentSalesCardProps {
  recentSubscriptions: RecentSubscription[];
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function RecentSalesCard({ recentSubscriptions }: RecentSalesCardProps) {
  const [isRegularModalOpen, setIsRegularModalOpen] = useState(false);
  const [isAllInOneModalOpen, setIsAllInOneModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<RecentSubscription | null>(null);

  const handleAssignTrainer = (subscription: RecentSubscription) => {
    setSelectedSubscription(subscription);
    if (subscription.isAllInOne) {
      setIsAllInOneModalOpen(true);
    } else {
      setIsRegularModalOpen(true);
    }
  };

  const handleTrainerAssigned = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleCloseModal = () => {
    setIsRegularModalOpen(false);
    setIsAllInOneModalOpen(false);
    setSelectedSubscription(null);
  };

  const renderTrainerInfo = (subscription: RecentSubscription) => {
    if (subscription.trainerAssignments.length === 0) {
      return (
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleAssignTrainer(subscription)}
          >
            <Plus className="h-3 w-3 mr-1" />
            {subscription.isAllInOne ? "Assign Trainers" : "Assign Trainer"}
          </Button>
        </div>
      );
    }

    if (subscription.isAllInOne) {
      // Show all assigned trainers for ALL_IN_ONE
      return (
        <div className="flex flex-col gap-1 mt-1">
          {subscription.trainerAssignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {assignment.trainerName} ({assignment.category})
              </span>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-1"
            onClick={() => handleAssignTrainer(subscription)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Manage Trainers
          </Button>
        </div>
      );
    } else {
      // For regular plans, find the trainer that matches the plan category
      const matchingAssignments = subscription.trainerAssignments.filter(
        assignment => assignment.category === subscription.planCategory
      );
      
      if (matchingAssignments.length > 0) {
        // If multiple assignments exist for the same category, show the first one
        const matchingAssignment = matchingAssignments[0];
        return (
          <div className="flex items-center gap-1 mt-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {matchingAssignment.trainerName}
            </span>
          </div>
        );
      } else {
        // No trainer assigned for this specific plan category
        return (
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleAssignTrainer(subscription)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Assign Trainer
            </Button>
          </div>
        );
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <p className="text-sm text-muted-foreground">
            You made {recentSubscriptions.length} sales this month.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                      {getInitials(subscription.customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{subscription.customerName}</p>
                    <p className="text-xs text-muted-foreground">{subscription.customerEmail}</p>
                    {renderTrainerInfo(subscription)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    +₹{subscription.subscriptionPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subscription.planName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regular Trainer Assignment Modal */}
      {selectedSubscription && !selectedSubscription.isAllInOne && (
        <AssignTrainerModal
          isOpen={isRegularModalOpen}
          onClose={handleCloseModal}
          customerName={selectedSubscription.customerName}
          customerEmail={selectedSubscription.customerEmail}
          planCategory={selectedSubscription.planCategory}
          clientId={selectedSubscription.userId}
          onTrainerAssigned={handleTrainerAssigned}
        />
      )}

      {/* ALL-IN-ONE Trainer Assignment Modal */}
      {selectedSubscription && selectedSubscription.isAllInOne && (
        <AllInOneTrainerModal
          isOpen={isAllInOneModalOpen}
          onClose={handleCloseModal}
          customerName={selectedSubscription.customerName}
          customerEmail={selectedSubscription.customerEmail}
          clientId={selectedSubscription.userId}
          onTrainerAssigned={handleTrainerAssigned}
        />
      )}
    </>
  );
}
