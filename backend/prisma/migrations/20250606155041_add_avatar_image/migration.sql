-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceMaterial" TEXT,
    "archetype" TEXT NOT NULL,
    "chatbotRole" TEXT NOT NULL,
    "conceptualAge" TEXT,
    "description" TEXT,
    "attire" TEXT,
    "colors" TEXT NOT NULL DEFAULT '[]',
    "features" TEXT,
    "imageUrl" TEXT,
    "avatarImage" TEXT,
    "tone" TEXT NOT NULL DEFAULT '[]',
    "pacing" TEXT,
    "inflection" TEXT,
    "vocabulary" TEXT,
    "primaryTraits" TEXT NOT NULL DEFAULT '[]',
    "secondaryTraits" TEXT NOT NULL DEFAULT '[]',
    "quirks" TEXT NOT NULL DEFAULT '[]',
    "interruptionTolerance" TEXT NOT NULL,
    "primaryMotivation" TEXT,
    "coreGoal" TEXT,
    "secondaryGoals" TEXT NOT NULL DEFAULT '[]',
    "coreAbilities" TEXT NOT NULL DEFAULT '[]',
    "approach" TEXT,
    "patience" TEXT,
    "demeanor" TEXT,
    "adaptability" TEXT,
    "greeting" TEXT,
    "affirmation" TEXT,
    "comfort" TEXT,
    "forbiddenTopics" TEXT NOT NULL DEFAULT '[]',
    "interactionPolicy" TEXT,
    "conflictResolution" TEXT,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "characters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "currentTime" TEXT NOT NULL DEFAULT 'morning',
    "currentScene" TEXT,
    "weather" TEXT DEFAULT 'clear',
    "lighting" TEXT DEFAULT 'natural',
    "ambiance" TEXT,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "sessions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mood" TEXT NOT NULL DEFAULT 'neutral',
    "energy" INTEGER NOT NULL DEFAULT 75,
    "cleanliness" INTEGER NOT NULL DEFAULT 90,
    "arousal" INTEGER NOT NULL DEFAULT 20,
    "clothing" TEXT NOT NULL DEFAULT '[]',
    "location" TEXT NOT NULL DEFAULT 'living_room',
    "lastAction" TEXT,
    "awareOf" TEXT NOT NULL DEFAULT '[]',
    "userFacts" TEXT NOT NULL DEFAULT '[]',
    "learnedEvents" TEXT NOT NULL DEFAULT '[]',
    "otherCharacterRelationships" JSONB,
    "characterId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "character_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "character_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageType" TEXT NOT NULL DEFAULT 'chat',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "emotionalWeight" REAL DEFAULT 0.5,
    "topics" TEXT NOT NULL DEFAULT '[]',
    "dayNumber" INTEGER NOT NULL DEFAULT 1,
    "timeOfDay" TEXT NOT NULL DEFAULT 'morning',
    "location" TEXT,
    "sessionId" TEXT NOT NULL,
    CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "character_memories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "memoryType" TEXT NOT NULL,
    "emotionalWeight" REAL NOT NULL DEFAULT 0.5,
    "importance" TEXT NOT NULL DEFAULT 'medium',
    "dayNumber" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "location" TEXT,
    "relatedCharacters" TEXT NOT NULL DEFAULT '[]',
    "topics" TEXT NOT NULL DEFAULT '[]',
    "vectorId" TEXT,
    "characterId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "settingType" TEXT NOT NULL DEFAULT 'indoor',
    "timeOfDay" TEXT,
    "mood" TEXT,
    "scenes" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_CharacterToSession" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToSession_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToSession_B_fkey" FOREIGN KEY ("B") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "character_states_characterId_sessionId_key" ON "character_states"("characterId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToSession_AB_unique" ON "_CharacterToSession"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToSession_B_index" ON "_CharacterToSession"("B");
