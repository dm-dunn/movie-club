-- CreateEnum
CREATE TYPE "MovieStatus" AS ENUM ('UNWATCHED', 'CURRENT', 'WATCHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile_picture_url" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "runtime_minutes" INTEGER,
    "tmdb_id" INTEGER,
    "poster_url" TEXT,
    "backdrop_url" TEXT,
    "overview" TEXT,
    "academy_nominations" INTEGER NOT NULL DEFAULT 0,
    "academy_wins" INTEGER NOT NULL DEFAULT 0,
    "status" "MovieStatus" NOT NULL DEFAULT 'UNWATCHED',
    "watched_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_picks" (
    "id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pick_round" INTEGER NOT NULL,
    "picked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "rated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_rankings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "personal_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picker_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "round_number" INTEGER NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "picker_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_periods" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "results_revealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requires_text_input" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL,

    CONSTRAINT "award_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "voting_period_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "text_input" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdb_id_key" ON "movies"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "movie_picks_movie_id_key" ON "movie_picks"("movie_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_movie_id_key" ON "ratings"("user_id", "movie_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_rankings_user_id_rank_key" ON "personal_rankings"("user_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "personal_rankings_user_id_movie_id_key" ON "personal_rankings"("user_id", "movie_id");

-- CreateIndex
CREATE INDEX "picker_queue_round_number_position_idx" ON "picker_queue"("round_number", "position");

-- CreateIndex
CREATE INDEX "picker_queue_is_current_idx" ON "picker_queue"("is_current");

-- CreateIndex
CREATE UNIQUE INDEX "picker_queue_round_number_position_key" ON "picker_queue"("round_number", "position");

-- CreateIndex
CREATE UNIQUE INDEX "voting_periods_year_key" ON "voting_periods"("year");

-- CreateIndex
CREATE UNIQUE INDEX "award_categories_name_key" ON "award_categories"("name");

-- CreateIndex
CREATE INDEX "votes_voting_period_id_idx" ON "votes"("voting_period_id");

-- CreateIndex
CREATE INDEX "votes_category_id_idx" ON "votes"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_voting_period_id_user_id_category_id_key" ON "votes"("voting_period_id", "user_id", "category_id");

-- AddForeignKey
ALTER TABLE "movie_picks" ADD CONSTRAINT "movie_picks_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_picks" ADD CONSTRAINT "movie_picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_rankings" ADD CONSTRAINT "personal_rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_rankings" ADD CONSTRAINT "personal_rankings_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picker_queue" ADD CONSTRAINT "picker_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voting_period_id_fkey" FOREIGN KEY ("voting_period_id") REFERENCES "voting_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "award_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
