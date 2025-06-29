-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'PLAYER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "money" INTEGER NOT NULL DEFAULT 5000,
    "bank" INTEGER NOT NULL DEFAULT 0,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "position_z" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dimension" INTEGER NOT NULL DEFAULT 0,
    "interior" INTEGER NOT NULL DEFAULT 0,
    "health" INTEGER NOT NULL DEFAULT 100,
    "armor" INTEGER NOT NULL DEFAULT 0,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "play_time" INTEGER NOT NULL DEFAULT 0,
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "influence" INTEGER NOT NULL DEFAULT 10,
    "territory" TEXT,
    "color" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "leader_id" TEXT,
    "ai_personality" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faction_memberships" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "faction_id" TEXT NOT NULL,
    "rank" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faction_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faction_wars" (
    "id" TEXT NOT NULL,
    "faction_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "winner_id" TEXT,

    CONSTRAINT "faction_wars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faction_events" (
    "id" TEXT NOT NULL,
    "faction_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npcs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "position_z" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "aggression" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "current_mood" TEXT NOT NULL DEFAULT 'neutral',
    "faction_id" TEXT,
    "intelligence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "last_interaction" TIMESTAMP(3),
    "loyalty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sociability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "npcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npc_interactions" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "npc_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "response" TEXT,
    "sentiment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "npc_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "boundary_data" TEXT NOT NULL,
    "center_x" DOUBLE PRECISION NOT NULL,
    "center_y" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "economic_value" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "strategic_value" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "population" INTEGER NOT NULL DEFAULT 0,
    "crime_level" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "law_enforcement" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "is_contested" BOOLEAN NOT NULL DEFAULT false,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "rewards" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "progress" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "assigned_to_id" TEXT,
    "estimated_duration" INTEGER,
    "location" TEXT,
    "requirements" TEXT,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_analytics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "play_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "actions_performed" INTEGER NOT NULL DEFAULT 0,
    "ai_interactions" INTEGER NOT NULL DEFAULT 0,
    "missions_completed" INTEGER NOT NULL DEFAULT 0,
    "money_earned" INTEGER NOT NULL DEFAULT 0,
    "experience_gained" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npc_memories" (
    "id" TEXT NOT NULL,
    "npc_id" TEXT NOT NULL,
    "player_id" TEXT,
    "memory_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "emotional_context" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "decay_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npc_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryAssociation" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "related_memory_id" TEXT NOT NULL,
    "association_type" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "npc_relationships" (
    "id" TEXT NOT NULL,
    "npc_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "trust" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "respect" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "fear" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "loyalty" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_interaction" TIMESTAMP(3),
    "interaction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npc_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_companions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companion_type" TEXT NOT NULL,
    "customizations" TEXT,
    "energy" INTEGER NOT NULL DEFAULT 100,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "level" INTEGER NOT NULL DEFAULT 1,
    "loyalty" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "memory" TEXT NOT NULL,
    "mood" TEXT NOT NULL DEFAULT 'neutral',
    "owner_id" TEXT NOT NULL,
    "skills" TEXT NOT NULL,

    CONSTRAINT "ai_companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_interactions" (
    "id" TEXT NOT NULL,
    "companion_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "satisfaction" DOUBLE PRECISION NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_progressions" (
    "id" TEXT NOT NULL,
    "companion_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "previous_level" INTEGER NOT NULL,
    "new_level" INTEGER NOT NULL,
    "experience_gained" INTEGER NOT NULL,
    "trigger" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_progressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faction_relationships" (
    "id" TEXT NOT NULL,
    "faction_id" TEXT NOT NULL,
    "target_faction_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "influence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trust_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tension_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "shared_territory" INTEGER NOT NULL DEFAULT 0,
    "economic_ties" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "military_strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "last_interaction" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faction_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faction_influence_matrix" (
    "id" TEXT NOT NULL,
    "faction_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "influence_score" DOUBLE PRECISION NOT NULL,
    "military_presence" DOUBLE PRECISION NOT NULL,
    "economic_control" DOUBLE PRECISION NOT NULL,
    "popular_support" DOUBLE PRECISION NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faction_influence_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_arcs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "arc_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "global_impact" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "player_choices" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_arcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "narrative_events" (
    "id" TEXT NOT NULL,
    "narrative_arc_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "location" TEXT,
    "triggered_by" TEXT,
    "consequences" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "narrative_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_narrative_involvement" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "narrative_arc_id" TEXT NOT NULL,
    "involvement_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "choices" TEXT NOT NULL,
    "reputation" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "rewards" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_narrative_involvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "factions_name_key" ON "factions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "faction_memberships_character_id_key" ON "faction_memberships"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "territories_name_key" ON "territories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "player_analytics_user_id_date_key" ON "player_analytics"("user_id", "date");

-- CreateIndex
CREATE INDEX "npc_memories_npc_id_memory_type_idx" ON "npc_memories"("npc_id", "memory_type");

-- CreateIndex
CREATE INDEX "npc_memories_player_id_idx" ON "npc_memories"("player_id");

-- CreateIndex
CREATE INDEX "npc_memories_importance_idx" ON "npc_memories"("importance");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryAssociation_memory_id_related_memory_id_key" ON "MemoryAssociation"("memory_id", "related_memory_id");

-- CreateIndex
CREATE UNIQUE INDEX "npc_relationships_npc_id_target_id_target_type_key" ON "npc_relationships"("npc_id", "target_id", "target_type");

-- CreateIndex
CREATE INDEX "companion_interactions_companion_id_created_at_idx" ON "companion_interactions"("companion_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "faction_relationships_faction_id_target_faction_id_key" ON "faction_relationships"("faction_id", "target_faction_id");

-- CreateIndex
CREATE UNIQUE INDEX "faction_influence_matrix_faction_id_territory_id_key" ON "faction_influence_matrix"("faction_id", "territory_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_narrative_involvement_player_id_narrative_arc_id_key" ON "player_narrative_involvement"("player_id", "narrative_arc_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_memberships" ADD CONSTRAINT "faction_memberships_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_memberships" ADD CONSTRAINT "faction_memberships_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_wars" ADD CONSTRAINT "faction_wars_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_wars" ADD CONSTRAINT "faction_wars_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "factions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_events" ADD CONSTRAINT "faction_events_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_interactions" ADD CONSTRAINT "npc_interactions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_interactions" ADD CONSTRAINT "npc_interactions_npc_id_fkey" FOREIGN KEY ("npc_id") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_analytics" ADD CONSTRAINT "player_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_memories" ADD CONSTRAINT "npc_memories_npc_id_fkey" FOREIGN KEY ("npc_id") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_memories" ADD CONSTRAINT "npc_memories_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryAssociation" ADD CONSTRAINT "MemoryAssociation_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "npc_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_relationships" ADD CONSTRAINT "npc_relationships_npc_id_fkey" FOREIGN KEY ("npc_id") REFERENCES "npcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_companions" ADD CONSTRAINT "ai_companions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_interactions" ADD CONSTRAINT "companion_interactions_companion_id_fkey" FOREIGN KEY ("companion_id") REFERENCES "ai_companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_interactions" ADD CONSTRAINT "companion_interactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_progressions" ADD CONSTRAINT "companion_progressions_companion_id_fkey" FOREIGN KEY ("companion_id") REFERENCES "ai_companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_relationships" ADD CONSTRAINT "faction_relationships_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_relationships" ADD CONSTRAINT "faction_relationships_target_faction_id_fkey" FOREIGN KEY ("target_faction_id") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_influence_matrix" ADD CONSTRAINT "faction_influence_matrix_faction_id_fkey" FOREIGN KEY ("faction_id") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faction_influence_matrix" ADD CONSTRAINT "faction_influence_matrix_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "narrative_events" ADD CONSTRAINT "narrative_events_narrative_arc_id_fkey" FOREIGN KEY ("narrative_arc_id") REFERENCES "narrative_arcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_narrative_involvement" ADD CONSTRAINT "player_narrative_involvement_narrative_arc_id_fkey" FOREIGN KEY ("narrative_arc_id") REFERENCES "narrative_arcs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_narrative_involvement" ADD CONSTRAINT "player_narrative_involvement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
