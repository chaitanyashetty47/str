import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { AppleSignInButton } from "@/components/apple-signin-button";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen justify-center gap-2 p-4">
        <div className="bg-white/90 backdrop-blur-sm border rounded-2xl shadow-xl p-8 max-w-md w-full">
          <FormMessage message={searchParams} />
          <Link href="/sign-in" className="w-full mt-6 bg-[#F31818] hover:bg-[#F31818]/90 rounded-full font-bold inline-block text-center py-3 text-white">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F31818]/5 via-[#00D115]/5 to-[#0D97FF]/5">
      
      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 items-start">
        {/* Left Section - Brand & Benefits (Mobile Second) */}
        <div className="p-8 space-y-8 order-2 md:order-1">
          <div className="text-center md:text-left space-y-6">
            <div className="flex justify-center md:justify-start">
              <Image src="/strentor.png" alt="Strentor Logo" width={150} height={120} className="w-32 h-24" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              WELCOME BACK TO <span className="text-[#F31818]">STRENTOR</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-gray-700">
              Your catalyst for total transformation. Continue your journey to become unstoppable.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              "90 day satisfaction guarantee",
              "Instant Access to Our Personalised Services", 
              "Instant Access to Our Community"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00D115] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-bold text-gray-800">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Sign In Form (Mobile First) */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-8 order-1 md:order-2">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Welcome back</h2>
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-[#F31818] hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          {/* Social Sign In Options */}
          <div className="space-y-4">
            <GoogleSignInButton />
            <AppleSignInButton />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                required
                className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
              />
            </div>
            <SubmitButton
              formAction={signInAction}
              pendingText="Signing in..."
              className="w-full bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold py-3 rounded-full text-lg transform hover:scale-105 transition-all"
            >
              Sign In
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link href="/forgot-password" className="text-[#F31818] hover:underline font-semibold text-sm">
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
