-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CLIENT', 'TRAINER', 'FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'MANIFESTATION_TRAINER', 'FITNESS_TRAINER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PhotoPrivacy" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "public"."PhotoType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "public"."PlanType" AS ENUM ('ONLINE', 'IN_PERSON', 'SELF_PACED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionCategory" AS ENUM ('FITNESS', 'PSYCHOLOGY', 'MANIFESTATION', 'ALL_IN_ONE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('CREATED', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'AUTHENTICATED', 'PENDING', 'PAUSED', 'HALTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."WorkoutCategory" AS ENUM ('HYPERTROPHY', 'STRENGTH', 'RELOAD', 'DELOAD', 'ENDURANCE');

-- CreateEnum
CREATE TYPE "public"."BodyPart" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'CORE', 'CARDIO', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "public"."CalculatorType" AS ENUM ('BMI', 'BMR', 'BODY_FAT', 'CALORIE_NEEDS', 'IDEAL_WEIGHT', 'LEAN_BODY_MASS', 'ONE_REP_MAX', 'MACRO_SPLIT');

-- CreateEnum
CREATE TYPE "public"."ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE');

-- CreateEnum
CREATE TYPE "public"."WorkoutPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."WeightUnit" AS ENUM ('KG', 'LB');

-- CreateEnum
CREATE TYPE "public"."IntensityMode" AS ENUM ('ABSOLUTE', 'PERCENT');

-- CreateEnum
CREATE TYPE "public"."HeightUnit" AS ENUM ('CM', 'INCHES', 'FEET');

-- CreateEnum
CREATE TYPE "public"."ExerciseType" AS ENUM ('WEIGHT_BASED', 'REPS_BASED');

-- CreateEnum
CREATE TYPE "public"."countries" AS ENUM ('ASCENSION_ISLAND', 'ANDORRA', 'UNITED_ARAB_EMIRATES', 'AFGHANISTAN', 'ANTIGUA_AND_BARBUDA', 'ANGUILLA', 'ALBANIA', 'ARMENIA', 'ANGOLA', 'ANTARCTICA', 'ARGENTINA', 'AMERICAN_SAMOA', 'AUSTRIA', 'AUSTRALIA', 'ARUBA', 'ALAND_ISLANDS', 'AZERBAIJAN', 'BOSNIA_HERZEGOVINA', 'BARBADOS', 'BANGLADESH', 'BELGIUM', 'BURKINA_FASO', 'BULGARIA', 'BAHRAIN', 'BURUNDI', 'BENIN', 'SAINT_BARTHELEMY', 'BERMUDA', 'BRUNEI_DARUSSALAM', 'BOLIVIA', 'BONAIRE_SINT_EUSTATIUS_AND_SABA', 'BRAZIL', 'BAHAMAS', 'BHUTAN', 'BOUVET_ISLAND', 'BOTSWANA', 'BELARUS', 'BELIZE', 'CANADA', 'COCOS_KEELING_ISLANDS', 'DEMOCRATIC_REPUBLIC_OF_CONGO', 'CENTRAL_AFRICAN_REPUBLIC', 'REPUBLIC_OF_CONGO', 'SWITZERLAND', 'COTE_DIVOIRE', 'COOK_ISLANDS', 'CHILE', 'CAMEROON', 'CHINA', 'COLOMBIA', 'COSTA_RICA', 'CUBA', 'CABO_VERDE', 'CURACAO', 'CHRISTMAS_ISLAND', 'CYPRUS', 'CZECH_REPUBLIC', 'GERMANY', 'DJIBOUTI', 'DENMARK', 'DOMINICA', 'DOMINICAN_REPUBLIC', 'ALGERIA', 'ECUADOR', 'ESTONIA', 'EGYPT', 'WESTERN_SAHARA', 'ERITREA', 'SPAIN', 'ETHIOPIA', 'FINLAND', 'FIJI', 'FALKLAND_ISLANDS', 'MICRONESIA', 'FAROE_ISLANDS', 'FRANCE', 'GABON', 'UNITED_KINGDOM', 'GRENADA', 'GEORGIA', 'FRENCH_GUIANA', 'GUERNSEY', 'GHANA', 'GIBRALTAR', 'GREENLAND', 'GAMBIA', 'GUINEA', 'GUADELOUPE', 'EQUATORIAL_GUINEA', 'GREECE', 'SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_ISLANDS', 'GUATEMALA', 'GUAM', 'GUINEA_BISSAU', 'GUYANA', 'HONG_KONG', 'HEARD_ISLAND_AND_MCDONALD_ISLANDS', 'HONDURAS', 'CROATIA', 'HAITI', 'HUNGARY', 'INDONESIA', 'IRELAND', 'ISRAEL', 'ISLE_OF_MAN', 'INDIA', 'BRITISH_INDIAN_OCEAN_TERRITORY', 'IRAQ', 'IRAN', 'ICELAND', 'ITALY', 'JERSEY', 'JAMAICA', 'JORDAN', 'JAPAN', 'KENYA', 'KYRGYZSTAN', 'CAMBODIA', 'KIRIBATI', 'COMOROS', 'SAINT_KITTS_AND_NEVIS', 'NORTH_KOREA', 'SOUTH_KOREA', 'KUWAIT', 'CAYMAN_ISLANDS', 'KAZAKHSTAN', 'LAOS', 'LEBANON', 'SAINT_LUCIA', 'LIECHTENSTEIN', 'SRI_LANKA', 'LIBERIA', 'LESOTHO', 'LITHUANIA', 'LUXEMBOURG', 'LATVIA', 'LIBYA', 'MOROCCO', 'MONACO', 'MOLDOVA', 'MONTENEGRO', 'SAINT_MARTIN', 'MADAGASCAR', 'MARSHALL_ISLANDS', 'NORTH_MACEDONIA', 'MALI', 'MYANMAR', 'MONGOLIA', 'MACAO', 'NORTHERN_MARIANA_ISLANDS', 'MARTINIQUE', 'MAURITANIA', 'MONTSERRAT', 'MALTA', 'MAURITIUS', 'MALDIVES', 'MALAWI', 'MEXICO', 'MALAYSIA', 'MOZAMBIQUE', 'NAMIBIA', 'NEW_CALEDONIA', 'NIGER', 'NORFOLK_ISLAND', 'NIGERIA', 'NICARAGUA', 'NETHERLANDS', 'NORWAY', 'NEPAL', 'NAURU', 'NIUE', 'NEW_ZEALAND', 'OMAN', 'PANAMA', 'PERU', 'FRENCH_POLYNESIA', 'PAPUA_NEW_GUINEA', 'PHILIPPINES', 'PAKISTAN', 'POLAND', 'SAINT_PIERRE_AND_MIQUELON', 'PITCAIRN', 'PUERTO_RICO', 'PALESTINE', 'PORTUGAL', 'PALAU', 'PARAGUAY', 'QATAR', 'REUNION', 'ROMANIA', 'SERBIA', 'RUSSIA', 'RWANDA', 'SAUDI_ARABIA', 'SOLOMON_ISLANDS', 'SEYCHELLES', 'SUDAN', 'SWEDEN', 'SINGAPORE', 'SAINT_HELENA', 'SLOVENIA', 'SVALBARD_AND_JAN_MAYEN', 'SLOVAKIA', 'SIERRA_LEONE', 'SAN_MARINO', 'SENEGAL', 'SOMALIA', 'SURINAME', 'SOUTH_SUDAN', 'SAO_TOME_AND_PRINCIPE', 'EL_SALVADOR', 'SINT_MAARTEN', 'SYRIA', 'ESWATINI', 'TURKS_AND_CAICOS_ISLANDS', 'CHAD', 'FRENCH_SOUTHERN_TERRITORIES', 'TOGO', 'THAILAND', 'TAJIKISTAN', 'TOKELAU', 'TIMOR_LESTE', 'TURKMENISTAN', 'TUNISIA', 'TONGA', 'TURKEY', 'TRINIDAD_AND_TOBAGO', 'TUVALU', 'TAIWAN', 'TANZANIA', 'UKRAINE', 'UGANDA', 'UNITED_STATES_MINOR_OUTLYING_ISLANDS', 'UNITED_STATES', 'URUGUAY', 'UZBEKISTAN', 'VATICAN_CITY', 'SAINT_VINCENT_AND_THE_GRENADINES', 'VENEZUELA', 'BRITISH_VIRGIN_ISLANDS', 'US_VIRGIN_ISLANDS', 'VIETNAM', 'VANUATU', 'WALLIS_AND_FUTUNA', 'SAMOA', 'KOSOVO', 'YEMEN', 'MAYOTTE', 'SOUTH_AFRICA', 'ZAMBIA', 'ZIMBABWE');

-- CreateTable
CREATE TABLE "public"."calculator_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" "public"."CalculatorType" NOT NULL,
    "inputs" JSONB NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "result_unit" TEXT,
    "date" DATE NOT NULL,

    CONSTRAINT "calculator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_max_lifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "list_exercise_id" UUID NOT NULL,
    "max_weight" DOUBLE PRECISION,
    "max_reps" INTEGER,
    "exercise_type" "public"."ExerciseType" NOT NULL DEFAULT 'WEIGHT_BASED',
    "last_updated" TIMESTAMP(3) NOT NULL,
    "date_achieved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "set_id" UUID,
    "is_invalid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "client_max_lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercise_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "set_id" UUID NOT NULL,
    "performed_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_date" DATE NOT NULL,
    "weight_used" DOUBLE PRECISION,
    "reps_done" INTEGER,
    "rpe" INTEGER,
    "notes" TEXT,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "payment_id" TEXT,
    "amount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "subscription_id" TEXT,
    "subscription_plan_id" TEXT,
    "webhook_event_id" UUID,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" "public"."SubscriptionCategory" NOT NULL,
    "plan_type" "public"."PlanType" NOT NULL DEFAULT 'ONLINE',
    "price" DECIMAL(10,2) NOT NULL,
    "features" JSONB,
    "razorpay_plan_id" TEXT NOT NULL,
    "billing_period" TEXT NOT NULL DEFAULT 'monthly',
    "billing_cycle" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trainer_clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "category" "public"."SubscriptionCategory",
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transformation_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "privacy_setting" "public"."PhotoPrivacy" DEFAULT 'PRIVATE',
    "photo_type" "public"."PhotoType" NOT NULL,
    "description" TEXT,
    "photo_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transformation_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "public"."SubscriptionStatus" DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "payment_status" "public"."PaymentStatus" DEFAULT 'PENDING',
    "razorpay_subscription_id" TEXT,
    "current_start" TIMESTAMP(3),
    "current_end" TIMESTAMP(3),
    "next_charge_at" TIMESTAMP(3),
    "total_count" INTEGER,
    "paid_count" INTEGER,
    "remaining_count" INTEGER,
    "retry_attempts" INTEGER DEFAULT 0,
    "cancel_requested_at" TIMESTAMP(3),
    "cancel_at_cycle_end" BOOLEAN DEFAULT false,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users_profile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'CLIENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "weight_unit" "public"."WeightUnit" DEFAULT 'KG',
    "height" DOUBLE PRECISION,
    "height_unit" "public"."HeightUnit" DEFAULT 'CM',
    "date_of_birth" TIMESTAMP(3),
    "gender" "public"."Gender",
    "activity_level" "public"."ActivityLevel" DEFAULT 'SEDENTARY',
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "neck" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "forearm" DOUBLE PRECISION,
    "wrist" DOUBLE PRECISION,
    "country" "public"."countries",
    "phone" TEXT,
    "onboarding_completed" TIMESTAMP(3),

    CONSTRAINT "users_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "webhook_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weight_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weight_unit" "public"."WeightUnit" NOT NULL DEFAULT 'KG',
    "date_logged" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_day_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_day_id" UUID NOT NULL,
    "list_exercise_id" UUID NOT NULL,
    "instructions" TEXT,
    "order" INTEGER NOT NULL,
    "youtube_link" TEXT,
    "notes" TEXT,
    "frontend_uid" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workout_day_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "day_date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "workout_type" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_exercise_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "youtube_link" TEXT,
    "gif_url" TEXT,
    "type" "public"."BodyPart" NOT NULL,
    "is_reps_based" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "workout_exercise_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "trainer_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_in_weeks" INTEGER NOT NULL,
    "category" "public"."WorkoutCategory" NOT NULL,
    "description" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intensity_mode" "public"."IntensityMode" NOT NULL DEFAULT 'ABSOLUTE',
    "status" "public"."WorkoutPlanStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_set_instructions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exercise_id" UUID NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "intensity" "public"."IntensityMode",
    "weight_prescribed" DOUBLE PRECISION,
    "rest_time" INTEGER,
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workout_set_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_day_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_day_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "video_url" TEXT NOT NULL,
    "video_title" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "trainer_notes" TEXT,

    CONSTRAINT "workout_day_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalculatorSession_date_idx" ON "public"."calculator_sessions"("date");

-- CreateIndex
CREATE INDEX "CalculatorSession_userId_category_idx" ON "public"."calculator_sessions"("user_id", "category");

-- CreateIndex
CREATE INDEX "ClientMaxLift_clientId_listExerciseId_idx" ON "public"."client_max_lifts"("client_id", "list_exercise_id");

-- CreateIndex
CREATE INDEX "ClientMaxLift_setId_idx" ON "public"."client_max_lifts"("set_id");

-- CreateIndex
CREATE INDEX "ClientMaxLift_clientId_listExerciseId_invalid_idx" ON "public"."client_max_lifts"("client_id", "list_exercise_id", "is_invalid");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_eventType_idx" ON "public"."subscription_events"("event_type");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_userId_idx" ON "public"."subscription_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerClient_trainerId_clientId_category_key" ON "public"."trainer_clients"("trainer_id", "client_id", "category");

-- CreateIndex
CREATE INDEX "UserSubscription_razorpaySubscriptionId_idx" ON "public"."user_subscriptions"("razorpay_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."users_profile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_webhookId_key" ON "public"."webhook_events"("webhook_id");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "public"."webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "WebhookEvent_webhookId_idx" ON "public"."webhook_events"("webhook_id");

-- CreateIndex
CREATE INDEX "WeightLog_userId_dateLogged_idx" ON "public"."weight_logs"("user_id", "date_logged");

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_dateLogged_key" ON "public"."weight_logs"("user_id", "date_logged");

-- CreateIndex
CREATE INDEX "workout_day_exercises_frontend_uid_idx" ON "public"."workout_day_exercises"("frontend_uid");

-- CreateIndex
CREATE INDEX "workout_day_exercises_workout_day_id_is_deleted_idx" ON "public"."workout_day_exercises"("workout_day_id", "is_deleted");

-- CreateIndex
CREATE INDEX "workout_days_plan_id_day_date_idx" ON "public"."workout_days"("plan_id", "day_date");

-- CreateIndex
CREATE INDEX "workout_days_plan_id_is_deleted_idx" ON "public"."workout_days"("plan_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExerciseList_name_key" ON "public"."workout_exercise_lists"("name");

-- CreateIndex
CREATE INDEX "WorkoutExerciseList_name_idx" ON "public"."workout_exercise_lists"("name");

-- CreateIndex
CREATE INDEX "WorkoutExerciseList_type_idx" ON "public"."workout_exercise_lists"("type");

-- CreateIndex
CREATE INDEX "workout_set_instructions_exercise_id_is_deleted_idx" ON "public"."workout_set_instructions"("exercise_id", "is_deleted");

-- CreateIndex
CREATE INDEX "WorkoutDayVideo_clientId_idx" ON "public"."workout_day_videos"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_day_videos_workout_day_id_key" ON "public"."workout_day_videos"("workout_day_id");

-- AddForeignKey
ALTER TABLE "public"."calculator_sessions" ADD CONSTRAINT "CalculatorSession_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_max_lifts" ADD CONSTRAINT "ClientMaxLift_listExerciseId_fkey" FOREIGN KEY ("list_exercise_id") REFERENCES "public"."workout_exercise_lists"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_max_lifts" ADD CONSTRAINT "ClientMaxLift_clientId_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_max_lifts" ADD CONSTRAINT "ClientMaxLift_setId_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."exercise_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_logs" ADD CONSTRAINT "ExerciseLog_clientId_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_logs" ADD CONSTRAINT "ExerciseLog_setId_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."workout_set_instructions"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription_events" ADD CONSTRAINT "SubscriptionEvent_webhookEventId_fkey" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription_events" ADD CONSTRAINT "SubscriptionEvent_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trainer_clients" ADD CONSTRAINT "TrainerClient_clientId_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."trainer_clients" ADD CONSTRAINT "TrainerClient_trainerId_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."transformation_photos" ADD CONSTRAINT "TransformationPhoto_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_subscriptions" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weight_logs" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_day_exercises" ADD CONSTRAINT "WorkoutDayExercise_listExerciseId_fkey" FOREIGN KEY ("list_exercise_id") REFERENCES "public"."workout_exercise_lists"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_day_exercises" ADD CONSTRAINT "WorkoutDayExercise_workoutDayId_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_days" ADD CONSTRAINT "WorkoutDay_planId_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_exercise_lists" ADD CONSTRAINT "WorkoutExerciseList_createdById_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_plans" ADD CONSTRAINT "WorkoutPlan_clientId_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_plans" ADD CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."workout_set_instructions" ADD CONSTRAINT "WorkoutSetInstruction_exerciseId_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."workout_day_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_day_videos" ADD CONSTRAINT "WorkoutDayVideo_workoutDayId_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_day_videos" ADD CONSTRAINT "WorkoutDayVideo_clientId_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users_profile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
