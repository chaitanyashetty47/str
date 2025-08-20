"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";

// Placeholder action - will be implemented later
const signInWithApple = async () => {
  console.log("Apple Sign In - To be implemented");
  // This will be implemented later in actions.ts
};

export function AppleSignInButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      onClick={() => startTransition(signInWithApple)}
      disabled={isPending}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all transform hover:scale-[1.02] bg-white text-black font-semibold"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
          fill="currentColor"
        />
      </svg>
      {isPending ? "Signing in..." : "Sign in with Apple"}
    </Button>
  );
}
