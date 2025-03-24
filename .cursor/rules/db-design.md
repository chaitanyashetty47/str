# STRENTOR Database Schema Design

This document outlines the database schema design for the STRENTOR application, focusing on user management, subscriptions, fitness tracking, and workout planning.

## Tables

### 1. Users Table

Handles user roles and basic profile details.

| Column Name | Data Type             | Constraints           | Description                                                                    |
|-------------|-----------------------|-----------------------|--------------------------------------------------------------------------------|
| `id`        | UUID                  | PRIMARY KEY           | Unique user identifier                                                           |
| `name`      | VARCHAR(255)          | NOT NULL              | Full name of the user                                                            |
| `email`     | VARCHAR(255)          | UNIQUE, NOT NULL      | User email (used for login via Supabase Auth)                                    |
| `role`      | USER-DEFINED          | NOT NULL              | Defines if user is a Client, Trainer, or Admin (multi-role supported)           |
| `created_at`| TIMESTAMP WITH TIME ZONE | DEFAULT NOW()         | Account creation date                                                            |

**Relationships:**

- Users can have multiple subscriptions.
- Users can be assigned workout plans and worksheets.
- Users can be trainers or clients.
- Users can upload transformation photos.
- Users have profiles.
- Users have workout logs.

### 2. Subscription Plans Table

Stores available subscription options.

| Column Name        | Data Type     | Constraints | Description                                     |
|--------------------|---------------|-------------|-------------------------------------------------|
| `id`               | UUID          | PRIMARY KEY | Unique identifier for each plan                 |
| `name`             | VARCHAR(255)  | NOT NULL    | Subscription plan name (e.g., Gold, Platinum)  |
| `category`         | USER-DEFINED  | NOT NULL    | Subscription type (fitness, psychology, etc.) |
| `plan_type`        | USER-DEFINED  | NULL        | Type of the plan, further categorization. |
| `price`            | NUMERIC       | NOT NULL    | Monthly subscription cost                       |
| `duration_months`  | INTEGER       | NOT NULL    | Duration of the plan in months                  |
| `features`         | JSONB         | NULL        | List of features included in the plan           |

**Relationships:**

- Subscription plans are referenced by user subscriptions.

### 3. User Subscriptions Table

Tracks active user subscriptions.

| Column Name     | Data Type             | Constraints                            | Description                                        |
|-----------------|-----------------------|----------------------------------------|----------------------------------------------------|
| `id`            | UUID                  | PRIMARY KEY                            | Unique subscription entry                          |
| `user_id`       | UUID                  | FOREIGN KEY → users(id)                | The user subscribed to this plan                   |
| `plan_id`       | UUID                  | FOREIGN KEY → subscription_plans(id)   | The subscription plan selected                     |
| `status`        | USER-DEFINED          | DEFAULT 'active'                       | Subscription status (active, expired, canceled)    |
| `start_date`    | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                          | Subscription start date                            |
| `end_date`      | TIMESTAMP WITH TIME ZONE | NOT NULL                               | Subscription expiration date                       |
| `payment_status`| USER-DEFINED          | DEFAULT 'pending'                      | Payment completion status (pending, completed, failed) |
| `trainer_id`    | UUID                  | FOREIGN KEY → users(id)                | Trainer associated with the subscription           |

**Relationships:**

- A user can have multiple subscriptions.
- Each subscription is linked to a specific plan.
- Subscriptions can have an associated trainer.

### 4. Profiles Table

Stores user-specific data based on their subscription.

| Column Name             | Data Type        | Constraints           | Description                                                                    |
|-------------------------|------------------|-----------------------|--------------------------------------------------------------------------------|
| `id`                    | UUID             | PRIMARY KEY           | Unique profile ID                                                              |
| `user_id`               | UUID             | FOREIGN KEY → users(id)| Associated user                                                                |
| `weight`                | DOUBLE PRECISION | NULL                  | User's weight (for fitness tracking)                                           |
| `body_fat_percentage`   | DOUBLE PRECISION | NULL                  | Body fat percentage (for fitness tracking)                                     |
| `psychological_tracker` | TEXT             | NULL                  | Placeholder for emotional tracking (Future Scope)                              |
| `manifestation_goals`   | TEXT             | NULL                  | Placeholder for manifestation goals (Future Scope)                               |

**Relationships:**

- A user profile links to their user ID and stores fitness/psychology/manifestation details.

### 5. Workout Plans Table

Trainers assign structured workout programs.

| Column Name      | Data Type             | Constraints                            | Description                                        |
|------------------|-----------------------|----------------------------------------|----------------------------------------------------|
| `id`             | UUID                  | PRIMARY KEY                            | Unique workout plan ID                             |
| `trainer_id`     | UUID                  | FOREIGN KEY → users(id)                | Trainer who created the plan                       |
| `user_id`        | UUID                  | FOREIGN KEY → users(id)                | User assigned to this plan                         |
| `name`           | VARCHAR(255)          | NOT NULL                               | Workout Plan Name                                  |
| `description`           | VARCHAR(255)          | NOT NULL                               | Workout Plan Description                                  |
| `category`       | USER-DEFINED          | NOT NULL                               | Type of workout (hypertrophy, strength, etc.)      |
| `duration_weeks` | INTEGER               | NOT NULL                               | Total duration of the plan                         |
| `created_at`     | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                          | Creation date                                      |
| `start_date`     | DATE                  | NULL                                   | Start date of workout plan                         |
| `end_date`       | DATE                  | NULL                                   | End date of workout plan                           |

**Relationships:**

- Each workout plan is assigned to a user by a trainer.
- A user can have multiple assigned workout plans.
- Workout plans have workout days.
- Workout plans have workout plan weeks.

### 6. Workout Days Table

Each day of a workout plan.

| Column Name      | Data Type     | Constraints                            | Description                          |
|------------------|---------------|----------------------------------------|--------------------------------------|
| `id`             | UUID          | PRIMARY KEY                            | Unique workout day ID                |
| `plan_id`        | UUID          | FOREIGN KEY → workout_plans(id)        | Associated workout plan            |
| `day_number`     | INTEGER       | NOT NULL                               | Day index (e.g., Day 1, Day 2)       |
| `workout_type`   | USER-DEFINED  | NOT NULL                               | Muscle group focus (legs, chest etc) |

**Relationships:**

- A Workout Plan has multiple Workout Days.
- Workout days have multiple exercises.
- Workout days have user workout logs.

### 7. Exercises Table

Exercises in each workout plan.

| Column Name       | Data Type     | Constraints                              | Description                        |
|-------------------|---------------|------------------------------------------|------------------------------------|
| `id`              | UUID          | PRIMARY KEY                              | Unique exercise ID                 |
| `workout_day_id`  | UUID          | FOREIGN KEY → workout_days(id)           | Workout day reference              |
| `name`            | VARCHAR(255)  | NOT NULL                                 | Exercise Name                      |
| `sets`            | INTEGER       | NOT NULL                                 | Number of sets                     |
| `reps`            | INTEGER       | NOT NULL                                 | Number of reps per set             |
| `rest_time`       | INTERVAL      | NULL                                     | Rest time between sets             |
| `notes`           | TEXT          | NULL                                     | Additional instructions            |

**Relationships:**

- A Workout Day contains multiple exercises.
- Exercises have user workout logs.

### 8. Trainer Clients Table

Links Clients to Trainers.

| Column Name   | Data Type             | Constraints                            | Description                                       |
|---------------|-----------------------|----------------------------------------|---------------------------------------------------|
| `id`          | UUID                  | PRIMARY KEY                            | Unique assignment ID                              |
| `trainer_id`  | UUID                  | FOREIGN KEY → users(id)                | Trainer assigned to a client                      |
| `client_id`   | UUID                  | FOREIGN KEY → users(id)                | Client assigned to the trainer                    |
| `assigned_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                       | Date the trainer was assigned to the client        |

**Relationships:**

- A trainer can have multiple clients.
- A client can have one or more trainers (for different programs).

### 9. Workout Plan Weeks Table

Stores workout plan weeks.

| Column Name   | Data Type | Constraints                            | Description                                |
|---------------|-----------|----------------------------------------|--------------------------------------------|
| `id`          | UUID      | PRIMARY KEY                            | Unique week ID                             |
| `plan_id`     | UUID      | FOREIGN KEY → workout_plans(id)        | Associated workout plan                    |
| `week_number` | INTEGER   | NOT NULL                               | Week number in the plan                    |
| `start_date`  | DATE      | NOT NULL                               | Start date of the week                     |
| `end_date`    | DATE      | NOT NULL                               | End date of the week                       |
| `status`      | USER-DEFINED | DEFAULT 'active'                    | Status of the week (active, completed etc.) |

**Relationships:**

- Workout Plan Weeks are associated with Workout Plans.
- Workout Plan Weeks are referenced by User Workout Logs.

### 10. User Workout Logs Table

Logs workout progress.

| Column Name      | Data Type             | Constraints                            | Description                                |
|------------------|-----------------------|----------------------------------------|--------------------------------------------|
| `id`             | UUID                  | PRIMARY KEY                            | Unique log entry                           |
| `user_id`        | UUID                  | FOREIGN KEY → users(id)                | User who logged the workout                |
| `workout_day_id` | UUID                  | FOREIGN KEY → workout_days(id)         | Reference to the workout day               |
| `exercise_id`    | UUID                  | FOREIGN KEY → exercises(id)            | Exercise referenced                        |
| `date_logged`    | DATE                  | NOT NULL                               | Date of the workout                        |
| `completed_sets` | INTEGER               | NOT NULL                               | Sets completed                             |
| `completed_reps` | INTEGER               | NOT NULL                               | Reps completed per set                     |
| `weight_used`    | DOUBLE PRECISION      | NULL                                   | Weight lifted                              |
| `plan_week_id`   | UUID                  | FOREIGN KEY → workout_plan_weeks(id)   | Reference to the workout plan week         |
| `optional_exercise`| VARCHAR(255)        | NULL                                   | Optional exercise performed                |

**Relationships:**

- Users log workouts based on their assigned plan.
- User Workout Logs reference Workout Days, Exercises, and Workout Plan Weeks.

### 11. Transformation Photos Table

Stores transformation photos.

| Column Name     | Data Type             | Constraints                            | Description                                |
|-----------------|-----------------------|----------------------------------------|--------------------------------------------|
| `id`            | UUID                  | PRIMARY KEY                            | Unique photo ID                            |
| `user_id`       | UUID                  | FOREIGN KEY → users(id)                | Associated user                            |
| `image_url`     | VARCHAR(255)          | NOT NULL                               | Image file URL                             |
| `uploaded_at`   | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()                          | Timestamp of upload                        |
| `privacy_setting`| USER-DEFINED          | DEFAULT 'private'                      | User-defined photo visibility              |
| `photo_type`    | USER-DEFINED          | NOT NULL                               | Indicates if the photo is 'before' or 'after'|
| `description`   | TEXT                  | NULL                                   | Optional description of the photo          |

**Relationships:**

- A user uploads transformation photos with timestamps.
- Transformation Photos are associated with Users.