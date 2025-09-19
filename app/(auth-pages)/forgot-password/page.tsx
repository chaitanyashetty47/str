import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen justify-center gap-2 p-4">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8 max-w-md w-full">
          <FormMessage message={searchParams} />
          <Link href="/forgot-password" className="w-full mt-6 bg-[#F31818] hover:bg-[#F31818]/90 rounded-full font-bold inline-block text-center py-3 text-white">
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
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              RESET YOUR <span className="text-[#F31818]">PASSWORD</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-muted-foreground">
              No worries! We'll help you reset your password and get back on track to your transformation journey.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              "Quick and secure password reset",
              "Instant email delivery", 
              "24/7 support available"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00D115] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-bold text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Reset Password Form (Mobile First) */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-8 order-1 md:order-2">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-card-foreground">Reset Password</h2>
            <p className="text-muted-foreground">
              Remember your password?{" "}
              <Link href="/sign-in" className="text-[#F31818] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          {/* Reset Password Form */}
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
            <SubmitButton
              formAction={forgotPasswordAction}
              pendingText="Sending reset link..."
              className="w-full bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold py-3 rounded-full text-lg transform hover:scale-105 transition-all"
            >
              Send Reset Link
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you don't receive an email within a few minutes, please check your spam folder.
            </p>
            <p className="text-xs text-muted-foreground">
              Need help?{" "}
              <Link href="/contact" className="text-[#F31818] hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
