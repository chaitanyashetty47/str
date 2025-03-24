
# **STRENTOR Website Routes**

This document outlines the routes for the STRENTOR website.

## **🔹 Public Routes (Accessible to All Users)**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/` | Home | Landing page with an overview of STRENTOR's services. |
| `/about` | About Us | Details about STRENTOR's mission and vision. |
| `/programs` | Programs | Overview of all fitness, psychological, and manifestation plans. |
| `/pricing` | Pricing | Displays all subscription plans. |
| `/resources` | Resource Center | Access to blogs, articles, and free content. |
| `/contact` | Contact & Support | Users can reach out via a contact form or live chat. |
| `/testimonials` | Testimonials & Success Stories | Showcases user experiences and transformations. |
| `/faq` | FAQ | Frequently asked questions. |
| `/terms` | Terms & Conditions | Legal policies and user agreements. |

---

## **🔹 Authentication Routes**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/login` | Login | User authentication page. |
| `/register` | Register | Sign-up page for new users. |
| `/forgot-password` | Forgot Password | Password recovery page. |

---

## **🔹 Private Routes (Only for Logged-In Users)**
### **User Dashboard & Profile**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/dashboard` | User Dashboard | Overview of user's subscriptions, progress, and worksheets. |
| `/profile` | User Profile | General information and account settings. |
| `/profile/subscriptions` | Subscription Management | View active subscriptions, upgrade/cancel plans. |
| `/profile/photos` | Before & After Photos | Upload and manage transformation photos. |

### **Workout & Coaching**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/workouts` | My Workout Plans | View assigned fitness programs. |
| `/workouts/:planId` | Workout Plan Details | Log workouts and track progress for a specific plan. |
| `/workouts/logs` | Workout Logs | View/edit logs for previous sessions. |
| `/psychology` | My Psychological Plans | View assigned psychological programs (Future Scope). |
| `/manifestation` | My Manifestation Plans | View assigned manifestation programs (Future Scope). |

### **Trainer & Admin Panel**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/admin` | Admin Dashboard | Overview of platform metrics, user data, and reports. |
| `/admin/users` | User Management | Manage user roles and accounts. |
| `/admin/subscriptions` | Subscription Management | Monitor user payments and renewals. |
| `/admin/reports` | Reports & Analytics | View user engagement and financial statistics. |
| `/trainer` | Trainer Dashboard | Trainers can assign workout plans and check progress. |
| `/trainer/clients` | Client Management | Trainers can see their assigned clients. |
| `/trainer/workouts` | Workout Plan Management | Trainers create and assign workout plans. |
| `/trainer/progress-logs/:clientId` | Client Progress Logs | Trainers can track workout progress for assigned clients. |

### **Future Scope**
| Route | Page Name | Description |
|--------|-----------|-------------|
| `/community` | Community Forum | Users discuss topics and share experiences. (Future Scope) |
| `/support` | Support | Ticketing system for user issues. (Future Scope) |
| `/chat` | Chat System | Future scope for real-time messaging with trainers. (Future Scope) |

---

## **🔹 Additional API Routes (Backend)**
| Route | Purpose |
|--------|---------|
| `/api/auth` | Handles user authentication (login, registration). |
| `/api/subscriptions` | Manages payment processing and subscriptions. |
| `/api/workouts` | Fetches, creates, and updates workout plans. |
| `/api/progress` | Logs user progress and tracking data. |
| `/api/trainer` | Assigns and updates user programs. |
| `/api/admin` | Admin-only actions (user management, reports, etc.). |

---

## **✅ Summary**
- **Public Pages:** Homepage, programs, resources, contact, testimonials, etc.  
- **Auth Pages:** Login, Register, Forgot Password.  
- **User Dashboard & Profile:** Subscription management, workout logs, worksheets.  
- **Trainer/Admin Panel:** Manage clients, assign workouts, monitor progress.  
- **Future Scope:** Community Forum, Support System, Real-Time Chat.
