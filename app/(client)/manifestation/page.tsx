import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifestation Goals | Strentor",
  description: "Set and track your manifestation goals for personal growth and achievement.",
};

export default function ManifestationPage() {
  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Manifestation Goals</h1>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-medium text-purple-800 mb-2">Coming Soon!</h2>
          <p className="text-purple-700">
            We're currently developing this feature to help you manifest your goals and desires.
            Check back soon for updates!
          </p>
        </div>
        
        <p className="text-gray-500 mb-8">
          The manifestation tool will guide you through setting intentions, visualizing outcomes, 
          and taking inspired action to help you achieve your dreams and goals.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Vision Board</h3>
            <p className="text-sm text-gray-600">Create digital vision boards to visualize your goals.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Daily Affirmations</h3>
            <p className="text-sm text-gray-600">Practice powerful affirmations to rewire your thinking.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Gratitude Journal</h3>
            <p className="text-sm text-gray-600">Track what you're grateful for to attract more positivity.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Goal Setting</h3>
            <p className="text-sm text-gray-600">Set and monitor progress on your manifestation goals.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
