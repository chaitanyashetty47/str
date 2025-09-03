import PageHeaderTemplate from "@/components/page-header-template";
import BMRCalculator from "@/components/calculator/bmr/BMRCalculator";
import { getWeightHeight } from "@/actions/body-measurement-metrics/get-weight-height.action";
import { getProfileDetails } from "@/actions/profile/get-profile-details.action";
import { ActivityLevel, Gender } from "@prisma/client";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic';

export default async function BMRCalculatorPage() {
  let weight = 0;
  let height = 0;
  let age: number | null = null;
  let gender: Gender = Gender.MALE;
  let activityLevel: ActivityLevel = ActivityLevel.SEDENTARY;

  try {
    const weightHeight = await getWeightHeight();
    
    if ('error' in weightHeight) {
      console.error("Error fetching weight/height:", weightHeight.error);
    } else {
      weight = weightHeight.weight;
      height = weightHeight.height;
    }

    const profileDetails = await getProfileDetails();

    console.log("Profile Details", profileDetails);
    
    // profileDetails is the direct profile object, not wrapped in error/success
    const dateOfBirth = profileDetails.date_of_birth;
    gender = profileDetails.gender || Gender.MALE;
    activityLevel = profileDetails.activity_level || ActivityLevel.SEDENTARY;
    
    // Calculate age from date of birth with precise calculation
    if (dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      
      // Calculate age with month and day precision
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      

      // Adjust age if birthday hasn't occurred yet this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      console.log("Age", age);
    }
    
  } catch (error) {
    console.error("Error fetching profile data:", error);
    // Use defaults if there's an error, but age will remain null
  }

  // If we couldn't calculate age or have missing essential data, show completion message
  if (age === null || height === 0 || weight === 0) {
    const missingFields = [];
    if (age === null) missingFields.push("date of birth");
    if (height === 0) missingFields.push("height");
    if (weight === 0) missingFields.push("weight");

    return (
      <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
        <PageHeaderTemplate 
          title="BMR Calculator" 
          description="Calculate your Basal Metabolic Rate (BMR) to understand your daily calorie needs at rest and with activity" 
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">Profile Information Required</h3>
          <p className="text-yellow-700 mb-4">
            To calculate your BMR accurately, please complete your profile with the following missing information:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mb-4">
            {missingFields.map(field => (
              <li key={field} className="capitalize">{field}</li>
            ))}
          </ul>
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
        title="BMR Calculator" 
        description="Calculate your Basal Metabolic Rate (BMR) to understand your daily calorie needs at rest and with activity" 
      />
      <BMRCalculator 
        initialWeight={weight} 
        initialHeight={height} 
        initialAge={age}
        initialGender={gender}
        initialActivityLevel={activityLevel}
      />
    </div>
  );
}
