import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-5xl p-4 md:p-8 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to <span className="text-primary">STRENTOR</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            No worries! We'll help you reset your password and get back on track to your transformation journey.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span>Quick and secure password reset</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span>Instant email delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span>24/7 support available</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Remember your password?{" "}
            <Link className="text-primary font-medium underline" href="/sign-in">
              Sign in
            </Link>
          </p>
          
          <form className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
            </div>
            <SubmitButton formAction={forgotPasswordAction} pendingText="Sending reset link...">
              Reset Password
            </SubmitButton>
            <FormMessage message={searchParams} />
          </form>
          
          <p className="text-xs text-muted-foreground mt-6 text-center">
            If you don't receive an email within a few minutes, please check your spam folder or{" "}
            <Link href="/contact" className="underline">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
