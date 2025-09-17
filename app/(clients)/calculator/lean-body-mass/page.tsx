import { getProfileDetails } from "@/actions/profile/get-profile-details.action";
import { redirect } from "next/navigation";
import { LBMCalculator } from "@/components/calculator/lean-body-mass/LBMCalculator";
import { createClient } from "@/utils/supabase/server";
import { validateServerRole } from "@/lib/server-role-validation";


export default async function LeanBodyMassPage() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);

  const profileDetails = await getProfileDetails();

  if (!profileDetails) {
    redirect("/settings");
  }

  const { height, gender, weight } = profileDetails;

  // If no height, weight, or gender, show warning message
  if (!height || !weight || !gender) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Profile Information Required
            </h2>
            <p className="text-yellow-700 mb-4">
              To calculate your lean body mass, we need your height, weight, and gender information.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lean Body Mass Calculator
          </h1>
          <p className="text-gray-600">
            Calculate your lean body mass using the Boer formula
          </p>
        </div>

        <LBMCalculator 
          height={height} 
          gender={gender} 
          weight={weight}
        />
      </div>
    </div>
  );
}