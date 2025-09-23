import Image from "next/image"


export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-strentor-blue/10 via-white to-strentor-yellow/10 flex items-center justify-center">
      <div className="text-center">
        {/* Strentor Logo */}
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/strentor.png" alt="Strentor Logo" width={150} height={120} className="w-32 h-24" />
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-strentor-red rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-strentor-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-strentor-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        <p className="text-gray-600 text-lg">
          Preparing your onboarding experience...
        </p>
      </div>
    </div>
  )
} 