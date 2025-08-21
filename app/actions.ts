"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const { signUpSchema } = await import("@/lib/schemas/auth");
  
  // Extract form data
  const fullName = formData.get("fullName")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  
  // Validate with Zod
  const validationResult = signUpSchema.safeParse({
    fullName,
    email,
    password,
    confirmPassword,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.errors;
    // Return the first validation error
    const firstError = errors[0];
    return encodedRedirect(
      "error",
      "/sign-up",
      firstError.message,
    );
  }

  const { fullName: validFullName, email: validEmail, password: validPassword } = validationResult.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.signUp({
    email: validEmail,
    password: validPassword,
    options: {
      //emailRedirectTo: `${origin}/auth/callback`,
      emailRedirectTo: `${origin}/confirm-email`,
      data: {
        full_name: validFullName,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const { signInSchema } = await import("@/lib/schemas/auth");
  
  // Extract form data
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  
  // Validate with Zod
  const validationResult = signInSchema.safeParse({
    email,
    password,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.errors;
    // Return the first validation error
    const firstError = errors[0];
    return encodedRedirect(
      "error",
      "/sign-in",
      firstError.message,
    );
  }

  const { email: validEmail, password: validPassword } = validationResult.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validEmail,
    password: validPassword,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // return redirect("/protected");
  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const { forgotPasswordSchema } = await import("@/lib/schemas/auth");
  
  // Extract form data
  const email = formData.get("email")?.toString();
  
  // Validate with Zod
  const validationResult = forgotPasswordSchema.safeParse({
    email,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.errors;
    // Return the first validation error
    const firstError = errors[0];
    return encodedRedirect(
      "error",
      "/forgot-password",
      firstError.message,
    );
  }

  const { email: validEmail } = validationResult.data;
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  const { error } = await supabase.auth.resetPasswordForEmail(validEmail, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// export const signInWithGoogle = async () => {
//   const supabase = await createClient();
//   const origin = (await headers()).get("origin");

//   await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: {
//       redirectTo: `${origin}/auth/callback`,
//     },
//   });
// };
export const signInWithGoogle = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(data.url);
};


