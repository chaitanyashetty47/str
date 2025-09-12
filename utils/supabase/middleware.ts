import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { decodeJWT, canAccessRoute, getDefaultRouteForRole } from "@/lib/auth-utils";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

     // Use existing session data from cookies, avoiding getSession() unless needed
    //  const sessionCookie = request.cookies.get('sb-access-token')?.value;

    //  console.log("sessionCookie: \n", sessionCookie)

       // Debug all cookies to identify the correct token
      //  const allCookies = request.cookies.getAll();
      //  console.log("Available cookies:", allCookies.map(c => `${c.name}: ${c.value}`).join(', '));
   
      //  // Try to use existing session cookie (e.g., sb-auth-token or similar)
      //  const sessionCookie = request.cookies.get('sb-auth-token')?.value || // Common Supabase cookie
      //                       request.cookies.get('sb-access-token')?.value; // Fallback
      //  console.log("sessionCookie:", sessionCookie);

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    // Get user and session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session , user: refreshedUser } } = await supabase.auth.refreshSession();
    const pathname = request.nextUrl.pathname;


     // Protected routes that require authentication
     const protectedRoutes = [
       '/protected', 
       '/training', 
       '/fitness', 
       '/psychological', 
       '/manifestation', 
       '/profile', 
       '/workouts', 
       '/admin',
       // Client routes
       '/calculator',
       '/plans',
       '/transformation',
       '/settings',
       '/pricing',
       '/personal-records',
       '/workout-plan',
       '/dashboard'
     ];
     const isProtectedRoute = protectedRoutes.some(route => 
       pathname.startsWith(route)
     );
     
     // Special protection for password reset page
     const isPasswordResetPage = pathname === '/protected/reset-password';


      // Redirect to sign-in if accessing protected route without auth
    if (isProtectedRoute && userError) {
      const redirectUrl = new URL('/sign-in', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Note: Password reset page protection is handled in the page component itself
    // to check for valid password reset session and URL parameters

//*** This is old code for protected routes */
    // protected routes
    // if (request.nextUrl.pathname.startsWith("/protected") && userError) {
    //   return NextResponse.redirect(new URL("/sign-in", request.url));
    // }

    // If user is authenticated, fetch their role from the users table
    // let userRole = null;
    // if (user && !userError) {
    //   const { data: userData, error: roleError } = await supabase
    //     .from("users")
    //     .select("role")
    //     .eq("id", user.id)
    //     .single();
      
    //   if (!roleError && userData) {
    //     userRole = userData.role;
    //   }
    // }

    // // Handle redirects based on user's role when they're at the root path
    // if (request.nextUrl.pathname === "/" && !userError && user) {
    //   // If user is a trainer, redirect to /training route
    //   if (userRole === "trainer") {
    //     return NextResponse.redirect(new URL("/training", request.url));
    //   }

    //   if (userRole === "admin") {
    //     return NextResponse.redirect(new URL("/admin", request.url));
    //   }
      
    //   // Default redirect for other authenticated users (clients, admin, etc.)
    //   return NextResponse.redirect(new URL("/home", request.url));
    // }

    //***This is the old code for protected routes */

    //***This is the new code for protected routes */
    // Enhanced role-based access control using JWT claims
    if (user && session?.access_token && !userError) {
      const claims = decodeJWT(session.access_token);
      
      if (claims) {
        
        // Redirect authenticated users away from auth pages
        const authPages = ['/sign-in', '/sign-up', '/forgot-password'];
        if (authPages.includes(pathname)) {
          const defaultRoute = getDefaultRouteForRole(claims.user_role);
          return NextResponse.redirect(new URL(defaultRoute, request.url));
        }
        
        // Check if user can access the route
        if (!canAccessRoute(claims.user_role, pathname)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        console.log("claims work well")
        console.log(claims)

        // Redirect incomplete profiles to onboarding
        if (!claims.profile_completed && 
            !pathname.startsWith('/onboarding') && 
            !pathname.startsWith('/sign-') &&
            !pathname.startsWith('/auth/') &&
            pathname !== '/') {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        // Redirect completed profiles away from onboarding
        if (claims.profile_completed && pathname.startsWith('/onboarding')) {
          const defaultRoute = getDefaultRouteForRole(claims.user_role);
          return NextResponse.redirect(new URL(defaultRoute, request.url));
        }

        // Handle legacy /training route - redirect to /fitness
        if (pathname.startsWith('/training')) {
          if (claims.user_role === 'FITNESS_TRAINER' || claims.user_role === 'FITNESS_TRAINER_ADMIN' || claims.user_role === 'TRAINER') {
            const newPath = pathname.replace('/training', '/fitness');
            return NextResponse.redirect(new URL(newPath, request.url));
          }
        }

        // Enhanced role-based redirects from root
        if (pathname === "/") {
          const defaultRoute = getDefaultRouteForRole(claims.user_role);
          return NextResponse.redirect(new URL(defaultRoute, request.url));
        }
      } else {
        // Fallback to database query if JWT claims not available
        const { data: userData, error: roleError } = await supabase
          .from("users_profile")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (!roleError && userData) {
          // Redirect authenticated users away from auth pages (fallback)
          const authPages = ['/sign-in', '/sign-up', '/forgot-password'];
          if (authPages.includes(pathname)) {
            const defaultRoute = getDefaultRouteForRole(userData.role);
            return NextResponse.redirect(new URL(defaultRoute, request.url));
          }
          
          if (pathname === "/") {
            const defaultRoute = getDefaultRouteForRole(userData.role);
            return NextResponse.redirect(new URL(defaultRoute, request.url));
          }
        } else {
          // Invalid or missing user role - redirect to sign-in with redirectTo
          const authPages = ['/sign-in', '/sign-up', '/forgot-password'];
          if (authPages.includes(pathname)) {
            const redirectUrl = new URL('/sign-in', request.url);
            redirectUrl.searchParams.set('redirectTo', pathname);
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    }
    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
