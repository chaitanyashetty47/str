export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-strentor-blue/10 via-white to-strentor-yellow/10 flex items-center justify-center">
      <div className="text-center">
        {/* Strentor Logo */}
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-strentor-red to-strentor-orange rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-strentor-red to-strentor-orange bg-clip-text text-transparent">
            Strentor
          </h1>
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