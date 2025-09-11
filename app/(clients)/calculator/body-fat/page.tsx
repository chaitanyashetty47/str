import PageHeaderTemplate from "@/components/page-header-template";
import BodyFatCalculator from "@/components/calculator/body-fat/BodyFatCalculator";
import { getWeightHeight } from "@/actions/body-measurement-metrics/get-weight-height.action";
import { getProfileDetails } from "@/actions/profile/get-profile-details.action";
import { Gender } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic';

export default async function BodyFatCalculatorPage() {
  //Check if user is logged in
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if(!user) {
    return redirect("/settings");
  }

  let weight = 0;
  let height = 0;
  let gender: Gender = Gender.MALE;
  let measurements = {
    neck: 0,
    waist: 0,
    hips: 0,
  };

  try {
    const weightHeight = await getWeightHeight();
    
    if ('error' in weightHeight) {
      console.error("Error fetching weight/height:", weightHeight.error);
    } else {
      weight = weightHeight.weight;
      height = weightHeight.height;
    }

    const profileDetails = await getProfileDetails();
    
    gender = profileDetails.gender || Gender.MALE;
    measurements = {
      neck: profileDetails.neck || 0,
      waist: profileDetails.waist || 0,
      hips: profileDetails.hips || 0,
    };
    
  } catch (error) {
    console.error("Error fetching profile data:", error);
  }

  // Check if user has required measurements
  const hasRequiredMeasurements = gender === Gender.MALE 
    ? (measurements.waist > 0 && measurements.neck > 0) 
    : (measurements.waist > 0 && measurements.neck > 0 && measurements.hips > 0);

  // If missing essential data, show completion message
  if (!hasRequiredMeasurements || height === 0) {
    const missingFields = [];
    if (height === 0) missingFields.push("height");
    if (measurements.waist === 0) missingFields.push("waist");
    if (measurements.neck === 0) missingFields.push("neck");
    if (gender === Gender.FEMALE) {
      if (measurements.hips === 0) missingFields.push("hips");
    }

    return (
      <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
        <PageHeaderTemplate 
          title="Body Fat Calculator" 
          description="Calculate your body fat percentage using the Navy formula for accurate body composition assessment" 
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">Profile Information Required</h3>
          <p className="text-yellow-700 mb-4">
            To calculate your body fat percentage accurately, please complete your profile with the following missing measurements:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mb-4">
            {missingFields.map(field => (
              <li key={field} className="capitalize">{field}</li>
            ))}
          </ul>
          <p className="text-yellow-700 mb-4">
            <strong>Note:</strong> {gender === Gender.MALE 
              ? "Men require height, waist, and neck measurements."
              : "Women require height, waist, hips, and neck measurements."
            }
          </p>
          <a 
            href="/settings" 
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Complete Profile →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate 
        title="Body Fat Calculator" 
        description="Calculate your body fat percentage using the Navy formula for accurate body composition assessment" 
      />
      <BodyFatCalculator 
        initialHeight={height} 
        initialGender={gender}
        initialMeasurements={measurements}
      />
    </div>
  );
} 