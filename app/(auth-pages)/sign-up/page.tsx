import { Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { AppleSignInButton } from "@/components/apple-signin-button";
import { SignUpForm } from "@/components/auth/signup-form";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

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
              CONNECT, SHARE AND <span className="text-[#F31818]">PLAY</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-gray-700">
              Join our community of wellness seekers and transform your life. Start your journey to become unstoppable today.
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

        {/* Right Section - Sign Up Form (Mobile First) */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-8 order-1 md:order-2">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Create an account</h2>
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#F31818] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          {/* Social Sign Up Options */}
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

          {/* Email Sign Up Form */}
          <SignUpForm searchParams={searchParams} />

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-[#F31818] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#F31818] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
              
  );
}
