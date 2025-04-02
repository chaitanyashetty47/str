import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psychological Tracker | Strentor",
  description: "Track your psychological well-being and mental health progress.",
};

export default function PsychologicalPage() {
  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Psychological Tracker</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-medium text-blue-800 mb-2">Coming Soon!</h2>
          <p className="text-blue-700">
            We're currently developing this feature to help you track your mental wellness journey.
            Check back soon for updates!
          </p>
        </div>
        
        <p className="text-gray-500 mb-8">
          The psychological tracker will allow you to monitor your mental well-being, track mood patterns, 
          and receive personalized recommendations to improve your overall mental health.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Mood Tracking</h3>
            <p className="text-sm text-gray-600">Record daily mood and emotions to identify patterns.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Stress Management</h3>
            <p className="text-sm text-gray-600">Tools and techniques to reduce stress levels.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Sleep Quality</h3>
            <p className="text-sm text-gray-600">Monitor your sleep habits and improve quality.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-2">Mindfulness Exercises</h3>
            <p className="text-sm text-gray-600">Guided practices to improve mental clarity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
