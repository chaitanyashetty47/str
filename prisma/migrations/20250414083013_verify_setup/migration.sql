-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."metric_type" AS ENUM ('bmi', 'calorie_calculator', 'body_fat_calculator', 'bmr_calculator', 'ideal_weight_calculator', 'lean_body_mass_calculator', 'healthy_weight_calculator', 'calories_burned_calculator', 'one_rep_max_calculator', 'macro_calculator', 'body_type_calculator');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."app_role" AS ENUM ('client', 'trainer', 'admin');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."payment_status" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."photo_privacy" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."photo_type" AS ENUM ('before', 'after');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."plan_type" AS ENUM ('online', 'in-person', 'self-paced');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."subscription_category" AS ENUM ('fitness', 'psychology', 'manifestation');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."subscription_status" AS ENUM ('active', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."week_status" AS ENUM ('active', 'completed', 'pending');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."workout_category" AS ENUM ('hypertrophy', 'strength', 'deload', 'endurance');

-- CreateEnum
CREATE TYPE IF NOT EXISTS "public"."workout_type" AS ENUM ('legs', 'chest_triceps', 'back_biceps', 'full_body');

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."exercise" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "youtube_link" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "trainer_id" UUID NOT NULL,
    "gif_url" TEXT,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."exercises_workout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_day_id" UUID NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "rest_time" interval,
    "notes" TEXT,
    "exercise_id" UUID NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."pr_history" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID,
    "exercise_id" UUID,
    "weight" DECIMAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "one_rm" DECIMAL DEFAULT (weight * ((1)::numeric + ((reps)::numeric / 30.0))),
    "date_achieved" DATE NOT NULL DEFAULT CURRENT_DATE,
    "log_set_id" UUID,

    CONSTRAINT "pr_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION,
    "body_fat_percentage" DOUBLE PRECISION,
    "psychological_tracker" TEXT,
    "manifestation_goals" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."subscription_events" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "event_type" VARCHAR NOT NULL,
    "payment_id" VARCHAR,
    "amount" DECIMAL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "subscription_id" TEXT,
    "subscription_plan_id" TEXT,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "category" "public"."subscription_category" NOT NULL,
    "plan_type" "public"."plan_type" DEFAULT 'online',
    "price" DECIMAL(10,2) NOT NULL,
    "features" JSONB,
    "razorpay_plan_id" VARCHAR,
    "billing_period" VARCHAR NOT NULL DEFAULT 'monthly',
    "billing_cycle" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."trainer_clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."transformation_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "privacy_setting" "public"."photo_privacy" DEFAULT 'private',
    "photo_type" "public"."photo_type" NOT NULL,
    "description" TEXT,
    "photo_date" DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT "transformation_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'active',
    "start_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'pending',
    "razorpay_subscription_id" TEXT,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."user_workout_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "workout_day_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "date_logged" DATE NOT NULL,
    "completed_sets" INTEGER NOT NULL,
    "completed_reps" INTEGER NOT NULL,
    "weight_used" DOUBLE PRECISION,
    "optional_exercise" VARCHAR(255),
    "week_number" INTEGER NOT NULL,
    "plan_week_id" UUID,

    CONSTRAINT "user_workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "public"."app_role" NOT NULL DEFAULT 'client',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "auth_user_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."workout_day_completion" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID,
    "plan_id" UUID,
    "workout_day_id" UUID,
    "week_number" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_day_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."workout_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "workout_type" TEXT NOT NULL,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."workout_log_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "log_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DECIMAL NOT NULL,
    "duration" interval,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_log_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."workout_plan_weeks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "public"."week_status" DEFAULT 'pending',

    CONSTRAINT "workout_plan_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."workout_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" "public"."workout_category" NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "description" TEXT DEFAULT '',
    "days" INTEGER,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."user_body_measurements" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "body_fat_percentage" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "date_logged" DATE NOT NULL,

    CONSTRAINT "user_body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."user_metrics" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "metric_type" "public"."metric_type" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date_logged" DATE NOT NULL,

    CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercise_name_key" ON "public"."exercise"("name");

-- CreateIndex
CREATE INDEX "idx_exercise_name" ON "public"."exercise" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "pr_history_user_exercise_idx" ON "public"."pr_history"("user_id", "exercise_id", "date_achieved");

-- CreateIndex
CREATE INDEX "idx_subscription_events_event_type" ON "public"."subscription_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_subscription_events_user_id" ON "public"."subscription_events"("user_id");

-- CreateIndex
CREATE INDEX "idx_razorpay_subscription_id" ON "public"."user_subscriptions"("razorpay_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "public"."users"("auth_user_id");

-- CreateIndex
CREATE INDEX "idx_users_auth_user_id" ON "public"."users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_day_completion_user_id_plan_id_workout_day_id_week__key" ON "public"."workout_day_completion"("user_id", "plan_id", "workout_day_id", "week_number");

-- CreateIndex
CREATE INDEX "idx_log_sets" ON "public"."workout_log_sets"("log_id");

-- AddForeignKey
ALTER TABLE "public"."exercise" ADD CONSTRAINT "exercise_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."exercises_workout" ADD CONSTRAINT "exercises_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."exercises_workout" ADD CONSTRAINT "exercises_workout_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pr_history" ADD CONSTRAINT "pr_history_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises_workout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pr_history" ADD CONSTRAINT "pr_history_log_set_id_fkey" FOREIGN KEY ("log_set_id") REFERENCES "public"."workout_log_sets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pr_history" ADD CONSTRAINT "pr_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subscription_events" ADD CONSTRAINT "subscription_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."trainer_clients" ADD CONSTRAINT "trainer_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."trainer_clients" ADD CONSTRAINT "trainer_clients_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."transformation_photos" ADD CONSTRAINT "transformation_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_workout_logs" ADD CONSTRAINT "user_workout_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises_workout"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_workout_logs" ADD CONSTRAINT "user_workout_logs_plan_week_id_fkey" FOREIGN KEY ("plan_week_id") REFERENCES "public"."workout_plan_weeks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_workout_logs" ADD CONSTRAINT "user_workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_workout_logs" ADD CONSTRAINT "user_workout_logs_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_day_completion" ADD CONSTRAINT "workout_day_completion_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_day_completion" ADD CONSTRAINT "workout_day_completion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_day_completion" ADD CONSTRAINT "workout_day_completion_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_days" ADD CONSTRAINT "workout_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_log_sets" ADD CONSTRAINT "workout_log_sets_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "public"."user_workout_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_plan_weeks" ADD CONSTRAINT "workout_plan_weeks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_plans" ADD CONSTRAINT "workout_plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_plans" ADD CONSTRAINT "workout_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_body_measurements" ADD CONSTRAINT "user_body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_metrics" ADD CONSTRAINT "user_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

