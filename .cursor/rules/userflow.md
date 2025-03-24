
# **STRENTOR User Flow**

## **1️⃣ User Registration & Authentication**
### **Flow:**
1. User visits `/register` and enters **name, email, and password**.
2. Supabase handles **authentication** and stores user details.
3. User is redirected to `/dashboard` after successful login.
4. If the user **forgets their password**, they go to `/forgot-password` to reset it.

---

## **2️⃣ Subscription Purchase & Management**
### **Flow:**
1. User logs in and goes to `/pricing`.
2. User selects a **subscription plan** (Fitness, Psychological, Manifestation) and is redirected to `/profile/subscriptions`.
3. Payment is processed via **Razorpay/Stripe**.
4. Upon successful payment:
   - **User Subscriptions Table** updates with **active plan**.
   - User gets **access to assigned workouts or plans** based on their subscription.
5. User can **view, upgrade, cancel, or renew** subscriptions from `/profile/subscriptions`.

---

## **3️⃣ User Dashboard (`/dashboard`)**
### **Flow:**
1. User logs in and is redirected to `/dashboard`.
2. Dashboard displays:
   - **Active Subscriptions**
   - **Current & Upcoming Workouts/Tasks**
   - **Progress Overview (Graphs & Logs)**
   - **Quick Actions (Log Workout, Update Profile)**

---

## **4️⃣ Workout Plans & Logging Progress**
### **Flow:**
1. User visits `/workouts` to see assigned workout plans.
2. User selects a plan (`/workouts/:planId`) to view **detailed workouts per day**.
3. User logs a workout by entering **sets, reps, weight** in `/workouts/logs`.
4. The system updates the **User Workout Logs Table**.
5. Users can view past logs and progress analytics.

---

## **5️⃣ Trainer Portal (`/trainer`)**
### **Flow:**
1. Trainer logs in and accesses `/trainer`.
2. Trainer sees a **list of assigned clients** under `/trainer/clients`.
3. Trainer assigns **workout plans** under `/trainer/workouts`.
4. Trainer tracks **client progress logs** via `/trainer/progress-logs/:clientId`.

---

## **6️⃣ Admin Panel (`/admin`)**
### **Flow:**
1. Admin logs in and accesses `/admin`.
2. Admin can:
   - Manage **Users (`/admin/users`)**
   - Manage **Subscriptions (`/admin/subscriptions`)**
   - View **Reports & Analytics (`/admin/reports`)**
   - Oversee **Trainer Assignments (`/admin/trainers`)**

---

## **7️⃣ Before & After Photos**
### **Flow:**
1. User visits `/profile/photos`.
2. User uploads transformation photos.
3. The system **timestamps and stores** images.
4. User can **choose privacy settings** (Private/Public).

---

## **8️⃣ Future Scope: Psychological & Manifestation Plans**
### **Flow:**
1. Users with active psychological/manifestation plans can access `/psychology` or `/manifestation`.
2. In the future, users will log progress via:
   - **Journaling**
   - **Mindset exercises**
   - **Visualization tools**

---

### **✅ Summary**
- **Users register, purchase subscriptions, and access their assigned plans.**
- **Trainers assign workouts and monitor progress.**
- **Admins oversee user management, subscriptions, and reports.**
- **Workout logs and progress tracking ensure accountability.**
- **Future features for psychological & manifestation tracking are planned.**
