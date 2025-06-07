Create a complete project documentation and development plan for **GangGPT**, a GTA V multiplayer server built on the [diamondrp](https://github.com/ragemp-pro/diamondrp) repository using RAGE\:MP. The goal is to transform the existing codebase into a modular, scalable, AI-powered experience centered around procedural missions, intelligent factions, and companion AI, with both Romanian and English language support. The server must be optimized for performance, collaborative development, and monetization.

The following must be implemented across the entire project:

**Use the latest styling practices**: BEM, SMACSS, OOCSS, utility-first with Tailwind.
**Use the latest coding practices**: DRY, KISS, YAGNI, SOLID, strict TypeScript, no implicit any.
**Use the latest testing practices**: TDD, BDD, Playwright for UI, integration tests for systems.
**Use the latest debugging practices**: Structured console logs, `debugger`, time-stamped server logs.
**Use the latest performance practices**: Lazy loading, code splitting, server zones, async processing.
**Use the latest security practices**: Input sanitization, schema validation, permission guards.
**Use the latest accessibility practices**: WCAG 2.1, ARIA labels, keyboard nav support.
**Use the latest SEO practices**: Meta tags, Open Graph, structured data, server discoverability.
**Use the latest web stack practices**: Tailwind CSS (with CVA and `clsx`), Zustand, Zod, Firebase, Next.js.
**Use the latest configuration practices**: `.env` management via `next-safe-env`, `.gitignore`, `turbo.json`, Plop.js for scaffolding.
**Use the latest Git practices**: Semantic commits, protected branches, PR review flow, GitHub Actions CI/CD.
**Use the latest deployment practices**: Auto-deploy dev/prod environments via Google Cloud (GCE/GKE), scalable load-balanced VM setup, containerized AI tasks.
**Use the latest documentation practices**: `README.md`, `DESCRIPTION.md`, API docs, architecture diagrams.
**Use the latest collaboration practices**: GitHub Issues, GitHub Projects, Discussions, Code Owners.
**Use the latest project management practices**: Agile, Sprint board, story points, contributor onboarding.
**Use the latest UX practices**: AI-driven onboarding, player profiling, retention loops, dopamine-optimized flows.
**Use the latest UI practices**: Wireframing, prototyping, motion design with Framer Motion, light/dark themes.
**Use the latest branding practices**: Custom logo, color palette, server lore tone, trailer script.
**Use the latest AI Agent practices**: `copilot-instructions.md`, memory continuity, granular task breakdown, commit-based iteration.

Your documentation must include the following:

---

### 🧠 AI SYSTEMS

* Integration of **Azure-hosted GPT-4 Turbo** as the core AI engine.
* **AI-powered NPC system** with dynamic memory, personalities, and evolving dialogue trees.
* **AI-generated missions** tailored to player behavior, reputation, and playstyle.
* **AI Companions** (character or pet) that level up, speak, and interact with the world and the player.
* **AI-based facțiuni (factions)** with memory, hierarchy, dynamic relationships, and internal politics.
* **Facțiune Matrix Engine**: dynamic simulation of influence, war, alliance, and resource flow among factions (player and AI).
* AI-generated job system with XP paths, branching evolution, and consequences based on moral decisions.
* **AI narrative engine** with micro-lore arcs and persistent outcomes based on user choices.
* AI moderation layer to filter toxicity and unexpected GPT output, tailored to RP gameplay.

---

### 💸 MONETIZATION FRAMEWORK

* **Tiered system**: free, silver, gold, platinum (includes access to AI perks like companion memory, private faction creation, or special GPT events).
* **Player-to-player economy**: enable monetization for players through in-game influence and AI-verified service economy (e.g. taxi, protection, mercenary).
* AI-generated **black market** economy with rare loot, illegal missions, or “faction-aligned” resources.
* Cosmetic shops for AI companions, NPC gang affiliation, voice packs.
* **AI-powered dynamic battle pass**, with time-based questlines and seasonal GPT story arcs.

---

### 🔧 DEV INFRASTRUCTURE

* Fork and refactor `diamondrp` into modular, documented packages.
* Set up Google Cloud environments:

  * `ganggpt-dev`: VM + managed SQL + Firebase for auth
  * `ganggpt-prod`: autoscaled zone clusters + CDN
* Full CI/CD pipeline from GitHub → Build → Deploy (with rollback and test coverage gates).
* Standardized `src/modules/` structure: `jobs`, `npc`, `economy`, `ai`, `factions`, `quests`, `utils`, etc.
* Local and remote dev workflow (support for agent-driven commits and collaborative work).
* Scoped Azure API key integration via `.env` with `openaiClient.ts` SDK wrapper.
* Dockerized services for headless testing, agent sandboxing, and AI load testing.

---

### 📚 DOCUMENTATION DELIVERABLES

* `README.md` with project purpose, stack, architecture, quickstart.
* `AI.md` with AI models, use cases, prompt structure, memory design.
* `INFRASTRUCTURE.md` with GCP architecture, services, and access strategy.
* `CONTRIBUTING.md` with branch naming, PR rules, and semantic commits.
* `copilot-instructions.md` for GitHub Copilot Chat Agent with long-term memory.
* `FACȚIUNI.md` outlining the behavior, structure, and AI engine rules of GangGPT factions.
* `LORE.md` with official lore, NPC archetypes, economic powers, and factions.

---

### 🎮 GAME DESIGN PRINCIPLES

* **Not strict RP**: world is driven by AI logic and player interaction, not bureaucracy.
* Replace classical "realistic job" systems with AI-evolving career trees.
* **Mission-based progression**: every action should lead to AI-determined consequences.
* Player becomes part of a story without needing admins or pre-scripted events.
* "Every player is the protagonist" = GPT decides quests, enemies, and rewards dynamically.

---

### 🔥 BRANDING & UI/UX

* Project name: **GangGPT**.
* Tagline: *"Rule the streets. Control the prompts."*
* Tone: darkly humorous, urban crime + AI paranoia.
* Style guide: sleek, neon-dark, with pastel accents (cyber-urban Art Nouveau optional).
* First trailer script (optional): narrated by an AI gang boss introducing the city.
* Companion AI pet preview with 3 visual themes (mechanical, street animal, virtual spirit).

---

### 🧪 USER EXPERIENCE / PLAYER LOOP

* AI-generated onboarding path based on personality quiz
* First mission is personal, adaptive, sets tone for alignment
* Every week new GPT-generated stories shift the city balance
* Player reputation tracked by both humans and AI factions
* Progression includes wealth, respect, fear, and influence

---

Make sure the entire documentation is:

* Written in markdown
* Optimized for GitHub readability and developer onboarding
* Structured so AI Agents can consume and continue each section autonomously
* Built with modularity, expandability, and maintainability in mind

Once the plan is generated, automatically begin forking the repo and creating the new structure, starting with the setup of the AI module, its configuration, and the first working AI NPC.
