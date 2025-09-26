import { FlowingEnergyLoader } from "@/components/ui/flowing-energy-loader";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <FlowingEnergyLoader />
      <p className="mt-8 text-lg font-medium text-muted-foreground animate-pulse">
        Loading Progress Page...
      </p>
    </div>
  );
}