
# **STRENTOR Product Requirements Document (PRD)**

## **1. Introduction**
STRENTOR is a holistic fitness and well-being platform designed to provide structured **Fitness Coaching, Psychological Support, and Manifestation Guidance**. The platform enables users to subscribe to different wellness plans, track progress, and interact with trainers. The primary goal is to offer a **seamless, structured, and engaging experience** for users who seek personal transformation.

### **Problem Statement**
Many individuals struggle with consistency and accountability in their fitness, mental well-being, and manifestation journeys. STRENTOR aims to bridge this gap by offering expert guidance, structured plans, and a **personalized tracking system** to ensure tangible progress.

### **Vision**
To create an **all-in-one** wellness ecosystem where users can achieve **physical, mental, and mindset transformation** through structured programs, interactive coaching, and measurable progress tracking.

---
## **2. Objectives & Goals**
### **Objectives**
- Provide a **unified platform** for fitness, mental well-being, and manifestation coaching.
- Offer **structured, trackable programs** for each subscription category.
- Integrate a **seamless payment system** for subscription management.
- Enable **data-driven progress tracking** for users and trainers.

### **Goals**
- Ensure users have **easy access** to their coaching materials, progress reports, and worksheets.
- Allow **trainers to assign workouts, tasks, and structured plans** efficiently.
- Build a **scalable architecture** that accommodates future feature enhancements.

---
## **3. Target Users & Roles**
### **User Roles**
- **Clients:** Users who subscribe to fitness, psychological, or manifestation services.
- **Trainers:** Experts assigned to clients based on their chosen plan.
- **Admins:** Manage platform operations, user roles, and content.

### **Role Permissions**
- **Clients:** View assigned plans, track progress, upload data (e.g., weight, photos), and manage subscriptions.
- **Trainers:** Assign workouts/tasks, track client progress, and provide feedback.
- **Admins:** Manage users, subscriptions, and content.
- **Multi-role:** Users can be both a trainer/admin and a client simultaneously.

---
## **4. Core Features for MVP**
### **User Management**
- Multi-role system (Client, Trainer, Admin)
- Trainer/Admin invitations & role assignment

### **Subscription System**
- Users can subscribe to multiple plans (Fitness, Psychological Support, Manifestation)
- Unified profile with tabs/dropdowns for different subscriptions
- Integrated payment gateway for seamless transactions

### **Workout & Coaching Assignments**
- Trainers manually assign workout plans (fitness)
- No pre-set fitness plans; fully customized approach
- Future scope: Psychological & Manifestation trainers assign tasks (journaling, mindset exercises, habit tracking)

### **User Profiles & Progress Tracking**
- General information section
- Service-specific metrics (e.g., weight, body fat % for fitness users)
- Worksheets & trackers based on subscription
- Progress analytics & visualizations
- Before & After photo uploads (with timestamps)

### **Payment & Billing**
- Subscription payments & renewals handled via integrated payment system
- Automated billing and renewal reminders

---
## **5. Future Scope**
- Psychological & Manifestation users will have their own structured worksheets.
- Trainers (non-fitness) will be able to assign structured tasks to users.
- More advanced progress tracking with **AI-driven insights**.
- Community features (e.g., forums, group challenges, social accountability).

---
## **6. User Journey**
### **Client Journey:**
1. Sign up & create a profile
2. Select and subscribe to a plan
3. Access assigned coaching materials & worksheets
4. Log progress & upload relevant data
5. Receive trainer feedback & insights
6. Renew or modify subscription

### **Trainer Journey:**
1. Accept trainer role & set up profile
2. Assign workouts/tasks to clients
3. Track client progress & provide feedback
4. Adjust plans based on user progress

### **Admin Journey:**
1. Manage users & roles
2. Oversee subscription & payment transactions
3. Ensure content and plan updates

---
## **7. Tech Stack**
- **Frontend:** Nextjs
- **Backend:** Supabase (PostgreSQL, Authentication)
- **AI Integration:** OpenAI APIs (for insights & smart recommendations in the future)
- **Payment Gateway:** Stripe/Razorpay (for subscriptions)
- **Data Visualization:** Chart.js or Recharts
