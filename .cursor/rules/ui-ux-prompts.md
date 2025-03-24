
# **STRENTOR UI/UX Design Prompts**

# **User Dashboard & Profile - UI/UX Prompts**

## **1️⃣ User Dashboard (`/dashboard`)**

### **🔹 Prompt for UI Design:**
"Design a clean, modern, and intuitive **User Dashboard** for STRENTOR. The dashboard should provide an overview of the user's subscriptions, workout progress, and quick actions. It should be easy to navigate, visually engaging, and provide instant insights into user activity."

### **🔸 Layout & Sections:**
- **Left Sidebar (Navigation Menu)**  
  - Dashboard (Home)  
  - My Subscriptions  
  - My Workouts  
  - My Psychological Plans  
  - My Manifestation Plans  
  - Profile & Settings  
  - Support  

- **Main Content (Dashboard Overview)**  
  - **Welcome Message:** Personalized greeting with the user's name and motivation quote.  
  - **Active Subscriptions:** Display active plans (Fitness, Psychological, Manifestation).  
  - **Current Plan Progress:** Progress bars showing completion percentage of assigned plans.  
  - **Upcoming Workouts/Tasks:** List of next scheduled sessions.  
  - **Progress Overview:** Graphs (Weight tracking, workout logs, improvement stats).  
  - **Quick Action Buttons:** "Log Workout," "Update Profile," "View Worksheets."  

### **🔸 Visual Style:**
- **Minimalist, card-based design** for easy readability.  
- **Color scheme:** Soft blues and greens for fitness, warm tones for psychology/manifestation.  
- **Icons & Progress Indicators** for easy tracking of workouts, subscriptions, and progress.  
- **Hover effects & subtle animations** for smooth user experience.  

---

## **2️⃣ User Profile (`/profile`)**

### **🔹 Prompt for UI Design:**
"Create a structured **User Profile Page** for a multi-service subscription platform. The design should allow users to view and manage personal data with clear sections and a professional layout. It should provide access to profile settings, subscription status, and fitness/psychological/manifestation progress."

### **🔸 Layout & Sections:**
- **Header Section:**  
  - User Avatar  
  - Name & Role (Client, Trainer, Admin)  
  - Edit Profile Button  
  - Logout Button (Supabase LogOut)

- **Tabs Navigation:**  
  - **General Info:** Name, Email 
  - **Subscription Details:** Active plans with renewal dates.  
  - **Service-Specific Data:**  
    - **Fitness Users:** Weight, Body Fat %, Workout Level.  
    - **Psychological Users:** Emotional Progress Tracker (Future Scope).  
    - **Manifestation Users:** Goal Mapping & Energy Tracking (Future Scope).  
  - **Before & After Photos:** Grid layout for progress tracking.  
  - **Privacy & Security:** Change password, enable 2FA.  

### **🔸 Visual Style:**
- **Profile Card Design** for user details.  
- **Dropdowns & Toggles** for navigating multiple subscriptions.  
- **Smooth animations & modal popups** for editing profile details.  
- **Light/Dark Mode Toggle** for accessibility.  

---

## **3️⃣ Subscription Management (`/profile/subscriptions`)**

### **🔹 Prompt for UI Design:**
"Design a structured and user-friendly **Subscription Management Page** for a multi-service wellness platform. Users should be able to view their current plans, upgrade/cancel subscriptions, and track payment history. The interface should be intuitive, ensuring smooth interaction."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: "My Subscriptions"  
  - Quick Overview: Display all active and past subscriptions.  

- **Active Subscriptions Section (Card-Based UI)**  
  - Plan Name & Type  
  - Price & Renewal Date  
  - Status (Active, Expired, Cancelled)  
  - **Action Buttons:** Upgrade, Renew, Cancel  

- **Subscription History Section (Table View)**  
  - List of previous subscriptions.  

- **Payment Management**  
  - Saved Payment Methods  
  - Billing History  

### **🔸 Visual Style:**
- **Card-based layout** for active subscriptions.  
- **Dropdown for switching between subscription types.**  
- **Progress Bars** to indicate plan completion.  
- **Seamless integration with Razorpay/Stripe for payments.**  

---

## **4️⃣ Before & After Photos (`/profile/photos`)**

### **🔹 Prompt for UI Design:**
"Design a **Before & After Photos Page** that allows users to upload transformation images. The UI should provide an organized way to track progress over time while ensuring user privacy. The page should feel motivational and goal-oriented."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: "My Transformation Journey"  
  - Short description: "Track your progress and see how far you've come."  

- **Photo Upload Section**  
  - Upload Button with Drag & Drop Support  
  - Allow one upload per day  
  - AI-Based Comparison Slider (Future Scope)  

- **Gallery Section**  
  - Grid layout with date-stamped images  
  - Toggle: "Show only Before & After"  
  - Privacy Controls (Private/Public Toggle)  

### **🔸 Visual Style:**
- **Minimalist and image-focused design.**  
- **Soft color gradients for a motivational feel.**  
- **Interactive sliders for before-after comparisons (Future Scope).**  
- **Lightbox View** for enlarging and viewing progress in detail.  

---

### **✅ Summary**
- **User Dashboard:** Displays active subscriptions, workout progress, and quick actions.
- **User Profile:** Allows users to manage their personal data and preferences.
- **Subscription Management:** Enables users to view, upgrade, or cancel subscriptions.
- **Before & After Photos:** Provides a way for users to track visual progress and manage privacy settings.




# **Workout & Coaching - UI/UX Prompts**

## **1️⃣ My Workout Plans (`/workouts`)**

### **🔹 Prompt for UI Design:**
"Design a **Workout Plans Page** where users can view their assigned fitness programs. The UI should be structured, motivational, and easy to navigate, ensuring users can track their progress effectively."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: **"My Workout Plans"**  
  - Quick summary of active workout plans  

- **Active Workout Plans (Card-Based UI)**  
  - Plan Name (e.g., Strength Training, Hypertrophy)  
  - Duration (e.g., 4 Weeks)  
  - Assigned Trainer (if applicable)  
  - Start & End Dates  
  - **CTA: "View Plan" Button**  

- **Upcoming Plans (Future Scope)**  
  - Display upcoming workout cycles  

### **🔸 Visual Style:**
- **Minimalist, structured layout with engaging visuals**
- **Progress bars** showing percentage completion
- **Motivational quotes or success metrics for encouragement**

---

## **2️⃣ Workout Plan Details (`/workouts/:planId`)**

### **🔹 Prompt for UI Design:**
"Create a detailed **Workout Plan Page** that allows users to log and track their workouts efficiently. The UI should provide structured workout routines with an easy-to-use logging system."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Plan Name & Description  
  - Assigned Trainer  
  - Plan Duration (Weeks & Days)  
  
- **Workout Routine (Day-Based View - Accordion UI)**  
  - **Each Day Includes:**  
    - Exercise Name  
    - Sets & Reps  
    - Notes (Trainer Tips)  
    - **CTA: "Log Workout" Button**  

- **Workout Progress Tracking**  
  - Graphs showing sets, reps, and weight lifted over time  

### **🔸 Visual Style:**
- **Accordion-style day-based workout plans for better usability**
- **Interactive logging buttons with real-time feedback**
- **Graphs & analytics showing workout performance trends**

---

## **3️⃣ Workout Logs (`/workouts/logs`)**

### **🔹 Prompt for UI Design:**
"Design a **Workout Logs Page** that allows users to view and edit past workout data. Users should be able to track their performance, identify progress trends, and make improvements."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: **"Workout Logs"**  
  - Quick overview of logged workouts  

- **Workout History Table (Date-Based Log)**  
  - **Columns:** Date, Exercise, Sets/Reps, Weight Used, Notes  
  - **Search & Filters:** View logs by **date range, workout type**  

- **Progress Visualization (Graphs & Stats)**  
  - Strength Progression Over Time  
  - Volume Tracking (Total Weight Lifted per Session)  
  - Workout Consistency Tracker (Heatmap Calendar)  

### **🔸 Visual Style:**
- **Table-based UI for structured logging**
- **Graph-heavy design for easy trend analysis**
- **Color-coded progress indicators** (Green = Improvement, Red = Regression)

---

## **4️⃣ Psychological Plans (`/psychology`) (Future Scope)**

### **🔹 Prompt for UI Design:**
"Create a **Psychological Plans Page** where users can access their stress management and emotional well-being exercises. Keep the design simple for now, with placeholders for future enhancements."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: **"My Psychological Plans"**  
  - Short description: **"Improve your mindset, manage stress, and track emotional well-being."**  

- **Active Psychological Plans (Card-Based UI)**  
  - Plan Name (e.g., Growth Mindset Program)  
  - Assigned Mentor  
  - Duration (Start & End Date)  
  - **CTA: "View Plan" Button**  

- **Future Enhancements (Placeholder Section)**  
  - Journaling & Reflection Tools  
  - Emotional Well-Being Progress Tracker  

### **🔸 Visual Style:**
- **Minimalist, calming theme with soft colors**
- **Simple card layout with structured plan details**
- **Dropdown navigation for multiple plans**

---

## **5️⃣ Manifestation Plans (`/manifestation`) (Future Scope)**

### **🔹 Prompt for UI Design:**
"Create a structured **Manifestation Plans Page** where users can access their goal-setting and energy alignment exercises. Keep the design simple for now, with placeholders for future enhancements."

### **🔸 Layout & Sections:**
- **Header Section**  
  - Page Title: **"My Manifestation Plans"**  
  - Short description: **"Visualize, align, and manifest your goals."**  

- **Active Manifestation Plans (Card-Based UI)**  
  - Plan Name (e.g., Quantum Manifestation Program)  
  - Assigned Mentor  
  - Duration (Start & End Date)  
  - **CTA: "View Plan" Button**  

- **Future Enhancements (Placeholder Section)**  
  - Visualization & goal-mapping tools  
  - Energy alignment trackers  

### **🔸 Visual Style:**
- **Spiritual & motivational theme with gradient backgrounds.**
- **Minimalist layout keeping only essential information.**
- **Dropdown navigation for multiple plans.**

---

### **✅ Summary**
- **Workout Plans:** View all assigned training programs.
- **Workout Plan Details:** Log workouts and track progress.
- **Workout Logs:** View/edit past workouts and analyze performance trends.
- **Psychological Plans (Future Scope):** Structured stress management programs.
- **Manifestation Plans (Future Scope):** Goal-setting and energy alignment plans.






# **Trainer & Admin Panel - UI/UX Prompts**

## **1️⃣ Trainer Dashboard (`/trainer`)**

### **🔹 Prompt for UI Design:**
"Design a **Trainer Dashboard** that provides trainers with an overview of their assigned clients, workout programs, and progress logs. The UI should be structured, data-driven, and intuitive, ensuring trainers can efficiently manage multiple clients."

### **🔸 Layout & Sections:**
- **Left Sidebar Navigation**  
  - Dashboard (Home)  
  - My Clients  
  - Assign Workout Plans  
  - View Client Progress  
  - Reports & Feedback  

- **Main Content (Trainer Overview)**  
  - **Quick Stats Cards:**  
    - Total Assigned Clients  
    - Active Workout Plans  
    - Recent Client Updates  
  - **Upcoming Client Sessions (List View)**  
    - Client Name, Session Type, Date  
    - Status: Pending / Completed  
  - **Quick Actions:**  
    - Assign New Plan  
    - Check Client Logs  

### **🔸 Visual Style:**
- **Card-based layout** with KPIs for quick insights.
- **Tables & Charts** for structured data visualization.
- **Dropdowns & Search Filters** for easy navigation.

---

## **2️⃣ Client Management (`/trainer/clients`)**

### **🔹 Prompt for UI Design:**
"Create a structured **Client Management Page** where trainers can view their assigned clients, access profiles, and track progress. The UI should allow quick searching, filtering, and easy access to client-specific data."

### **🔸 Layout & Sections:**
- **Client List Table (Paginated View)**  
  - **Columns:** Name, Subscription Type, Last Workout Logged, Progress Status  
  - **Search & Filters:** Filter by Plan Type (Fitness, Psychological, Manifestation)  
  - **Action Buttons:**  
    - **View Progress Logs** → Redirects to `/trainer/progress-logs/:clientId`  
    - **Assign Workout Plan** → Redirects to `/trainer/workouts`  

- **Client Profile Quick View (Expandable Section)**  
  - Basic Info: Name, Age, Contact  
  - Active Subscription Plans  
  - Past Training Logs & Notes  

### **🔸 Visual Style:**
- **Table-based UI** for quick client browsing.
- **Expandable client profile sections** for quick insights.
- **Color-coded progress indicators** (e.g., Green: On Track, Red: Needs Attention).

---

## **3️⃣ Workout Plan Management (`/trainer/workouts`)**

### **🔹 Prompt for UI Design:**
"Design a **Workout Plan Management Page** where trainers can create, edit, and assign structured workout programs to clients. The UI should be intuitive and support multi-week plans."

### **🔸 Layout & Sections:**
- **Workout Plans List (Card-Based UI)**  
  - Plan Name, Assigned Clients, Duration & Progress  
  - **Action Buttons:** Edit, Assign to Client  

- **Workout Plan Creation Form**  
  - **Plan Name & Type (Dropdown: Hypertrophy, Deload, Strength, etc.)**  
  - **Plan Duration (Weeks/Days Selector)**  
  - **Day-Based Routine Entry (Accordion Style)**  
    - Exercise Name  
    - Sets & Reps  
    - Notes / Trainer Instructions  

- **Assign Plan to Client**  
  - Dropdown Selection for Clients  
  - Confirmation Modal  

### **🔸 Visual Style:**
- **Step-by-step workout creation UI** for better usability.
- **Accordion structure for day-based routines.**
- **Actionable buttons for quick modifications.**

---

## **4️⃣ Client Progress Logs (`/trainer/progress-logs/:clientId`)**

### **🔹 Prompt for UI Design:**
"Create a **Client Progress Logs Page** where trainers can analyze workout progress for a specific client. The interface should be structured for easy tracking, filtering, and performance evaluation."

### **🔸 Layout & Sections:**
- **Header Section:**  
  - Page Title: **"Client Progress Logs"**  
  - **Client Name & Profile Picture**  
  - Back Button: **"← View All Clients"** (Redirects to `/trainer/clients`)  

- **Workout Progress Log Table:**  
  - **Columns:** Date, Exercise, Sets/Reps, Weight Used, Notes  
  - **Search & Filters:** Filter logs by **date range or exercise type**  

- **Visual Progress Indicators:**  
  - **Graphs & Charts** showing **strength progression over time**  
  - **Consistency Tracker (Heatmap Calendar)**  

- **Trainer Notes Section:**  
  - Add feedback & comments for the client  

### **🔸 Visual Style:**
- **Graph-heavy layout** for easy progress visualization.
- **Minimalist table for workout logs.**
- **Dropdown for switching between progress types (e.g., weight lifted, consistency).**

---

### **✅ Summary**
- **Trainer Dashboard:** Displays assigned clients, workout plans, and logs.
- **Client Management:** Trainers can browse and manage client data.
- **Workout Plan Management:** Allows trainers to create and assign workout routines.
- **Client Progress Logs:** Trainers can analyze individual client progress.





# **Authentication - UI/UX Prompts**

## **1️⃣ Login Page (`/login`)**

### **🔹 Prompt for UI Design:**
"Create a **modern, secure, and intuitive Login Page** that allows users to sign in using **Email/Password and Google OAuth**. The page should be user-friendly, accessible, and visually engaging."

### **🔸 Layout & Sections:**
- **Header Section**  
  - STRENTOR logo  
  - Page Title: **"Welcome Back! Login to Your Account"**  

- **Login Form**  
  - Email Input Field  
  - Password Input Field (with Show/Hide Toggle)  
  - "Remember Me" Checkbox  
  - **CTA: "Login" Button**  
  - **Google OAuth Button:** "Sign in with Google"  
  - **Forgot Password Link**  

- **Sign Up Redirect Section**  
  - "New to STRENTOR? [Register Here]"  

### **🔸 Visual Style:**
- **Minimalist & clean design with high contrast.**
- **Google OAuth button with Google branding.**
- **Subtle animations & real-time form validation.**

---

## **2️⃣ Registration Page (`/register`)**

### **🔹 Prompt for UI Design:**
"Design a **seamless and engaging Registration Page** for new users to create an account using Email/Password or Google OAuth. Ensure the UI is user-friendly with step-by-step guidance."

### **🔸 Layout & Sections:**
- **Header Section**  
  - STRENTOR logo  
  - Page Title: **"Create Your Account"**  

- **Registration Form**  
  - Full Name Input Field  
  - Email Input Field  
  - Password Input Field (with Strength Indicator)  
  - Confirm Password Field  
  - "Agree to Terms & Conditions" Checkbox  
  - **CTA: "Sign Up" Button**  
  - **Google OAuth Button:** "Sign up with Google"  

- **Login Redirect Section**  
  - "Already have an account? [Login Here]"  

### **🔸 Visual Style:**
- **Step-by-step form layout for better usability.**
- **Password strength meter for security guidance.**
- **Clear error messages for validation.**

---

## **3️⃣ Forgot Password Page (`/forgot-password`)**

### **🔹 Prompt for UI Design:**
"Create a **simple and effective Password Recovery Page** where users can reset their password securely using their email. The design should be clear, with clear instructions and feedback."

### **🔸 Layout & Sections:**
- **Header Section**  
  - STRENTOR logo  
  - Page Title: **"Reset Your Password"**  
  - Short instructions: "Enter your registered email to receive a password reset link."  

- **Forgot Password Form**  
  - Email Input Field  
  - **CTA: "Send Reset Link" Button**  
  - Back to Login Button  

- **Confirmation Message (After Submission)**  
  - "A password reset link has been sent to your email. Please check your inbox."  

### **🔸 Visual Style:**
- **Simple & minimal with clear call-to-actions.**
- **Confirmation messages for reassurance.**
- **Subtle animations for a smooth experience.**

---

### **✅ Summary**
- **Login Page:** Users can sign in via Email/Password or Google OAuth.
- **Registration Page:** Users can create accounts via Email/Password or Google OAuth.
- **Forgot Password Page:** Users can reset their password via email verification.
