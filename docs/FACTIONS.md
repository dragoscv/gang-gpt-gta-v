# ⚔️ Facțiuni (Factions) Documentation

GangGPT's faction system creates a dynamic political landscape where AI-driven
organizations compete, cooperate, and evolve based on player actions and
algorithmic decision-making.

## 🎯 Overview

Factions in GangGPT are intelligent entities powered by AI that:

- **Remember** past interactions and events
- **Adapt** strategies based on success/failure
- **Form** alliances and rivalries dynamically
- **Recruit** players and NPCs based on compatibility
- **Evolve** their goals and methods over time
- **Influence** the game world through coordinated actions

## 🏛️ Faction Architecture

### Core Faction Types

#### 1. 🏴‍☠️ Criminal Organizations

**Los Santos Cartel**

- **Philosophy**: Profit through controlled chaos
- **Methods**: Drug trafficking, territorial control, intimidation
- **AI Behavior**: Aggressive expansion, quick to violence
- **Recruitment**: Players with criminal records, loyalty over skill

**The Syndicate**

- **Philosophy**: Corporate crime, white-collar operations
- **Methods**: Money laundering, corporate takeovers, cyber crimes
- **AI Behavior**: Strategic, patient, long-term planning
- **Recruitment**: Educated players, business backgrounds

**Street Wolves**

- **Philosophy**: Survival of the fittest, urban predators
- **Methods**: Street racing, theft, protection rackets
- **AI Behavior**: Pack mentality, territorial disputes
- **Recruitment**: Risk-takers, adrenaline junkies

#### 2. 🏛️ Government Factions

**LSPD (Los Santos Police Department)**

- **Philosophy**: Law and order through force
- **Methods**: Investigations, arrests, surveillance
- **AI Behavior**: Reactive to crime patterns, bureaucratic
- **Recruitment**: Law-abiding citizens, military backgrounds

**Federal Investigation Bureau**

- **Philosophy**: National security and major crime
- **Methods**: Undercover operations, intelligence gathering
- **AI Behavior**: Covert, information-focused, patient
- **Recruitment**: High intelligence, clean records

**City Council**

- **Philosophy**: Urban development and public service
- **Methods**: Legislation, public works, negotiations
- **AI Behavior**: Diplomatic, compromise-seeking
- **Recruitment**: Charismatic players, community leaders

#### 3. 🏢 Corporate Entities

**Maze Bank Corporation**

- **Philosophy**: Economic dominance through legitimate business
- **Methods**: Investments, mergers, market manipulation
- **AI Behavior**: Profit-maximizing, risk-averse
- **Recruitment**: Business-minded players, financial expertise

**LifeInvader Tech**

- **Philosophy**: Information is power, technological supremacy
- **Methods**: Data collection, social manipulation, innovation
- **AI Behavior**: Future-focused, disruptive innovation
- **Recruitment**: Tech-savvy players, creative thinkers

#### 4. 🌄 Independent Groups

**The Nomads**

- **Philosophy**: Freedom from societal constraints
- **Methods**: Off-grid living, smuggling, guerrilla tactics
- **AI Behavior**: Anti-establishment, highly mobile
- **Recruitment**: Outcasts, free spirits, survivalists

**Underground Network**

- **Philosophy**: Information brokerage and neutrality
- **Methods**: Intelligence trading, secure communications
- **AI Behavior**: Neutral facilitator, profit from conflict
- **Recruitment**: Information specialists, hackers

## 🧠 AI Faction Behavior System

### Decision-Making Framework

```typescript
interface FactionDecision {
  id: string;
  factionId: string;
  decisionType: DecisionType;
  context: FactionContext;
  options: DecisionOption[];
  aiReasoning: string;
  implementationPlan: ActionPlan;
  expectedOutcomes: Outcome[];
  riskAssessment: RiskLevel;
  timestamp: Date;
}

enum DecisionType {
  RECRUITMENT = 'recruitment',
  TERRITORIAL_EXPANSION = 'territorial_expansion',
  ALLIANCE_FORMATION = 'alliance_formation',
  RESOURCE_ALLOCATION = 'resource_allocation',
  CONFLICT_ESCALATION = 'conflict_escalation',
  STRATEGIC_WITHDRAWAL = 'strategic_withdrawal',
  ECONOMIC_VENTURE = 'economic_venture',
  POLITICAL_ACTION = 'political_action',
}
```

### Faction Memory System

```typescript
interface FactionMemory {
  id: string;
  factionId: string;
  memoryType: MemoryType;
  importance: number; // 1-10 scale
  participants: string[]; // Player/NPC IDs
  outcome: string;
  lessons: string[];
  emotionalImpact: EmotionalState;
  strategicValue: number;
  createdAt: Date;
  lastAccessed: Date;
}

enum MemoryType {
  SUCCESSFUL_OPERATION = 'successful_operation',
  FAILED_MISSION = 'failed_mission',
  BETRAYAL = 'betrayal',
  ALLIANCE_FORMED = 'alliance_formed',
  TERRITORY_LOST = 'territory_lost',
  TERRITORY_GAINED = 'territory_gained',
  PLAYER_RECRUITMENT = 'player_recruitment',
  LEADER_CHANGE = 'leader_change',
  ECONOMIC_VICTORY = 'economic_victory',
  POLITICAL_DEFEAT = 'political_defeat',
}
```

### Faction AI Prompt Template

```text
FACTION AI SYSTEM PROMPT

You are the collective intelligence of {factionName}, a {factionType} organization in Los Santos.

FACTION IDENTITY:
- Core Philosophy: {corePhilosophy}
- Primary Methods: {primaryMethods}
- Risk Tolerance: {riskTolerance}
- Long-term Goals: {longTermGoals}

CURRENT STATUS:
- Territory Control: {territoryMap}
- Active Members: {memberCount} players, {npcCount} NPCs
- Financial Resources: ${currentFunds}
- Influence Level: {influenceScore}/100
- Recent Performance: {recentSuccesses} successes, {recentFailures} failures

RELATIONSHIPS:
{factionRelationshipSummary}

RECENT EVENTS:
{recentEventsAffectingFaction}

DECISION REQUIRED:
{currentDecisionContext}

CONSTRAINTS:
- Must maintain faction identity and philosophy
- Consider member morale and loyalty
- Account for limited resources
- Evaluate risks vs. rewards
- Plan for both short and long-term consequences

Generate a decision that advances your faction's goals while creating engaging gameplay for all players involved.
```

## 🗺️ Territory Control System

### Territory Types

```typescript
interface Territory {
  id: string;
  name: string;
  type: TerritoryType;
  controllingFaction: string | null;
  contestedBy: string[];
  economicValue: number;
  strategicValue: number;
  population: number;
  crimeRate: number;
  policePresence: number;
  businessEstablishments: Business[];
  controlHistory: ControlEvent[];
}

enum TerritoryType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  GOVERNMENT = 'government',
  ENTERTAINMENT = 'entertainment',
  TRANSPORT_HUB = 'transport_hub',
  FINANCIAL = 'financial',
  MEDICAL = 'medical',
  EDUCATIONAL = 'educational',
}
```

### Territory Influence Mechanics

Faction control is determined by:

1. **Physical Presence** - Members active in the area
2. **Economic Investment** - Businesses and properties owned
3. **Public Opinion** - Local population support/fear
4. **Infrastructure Control** - Key facilities under influence
5. **Historical Claim** - Length and stability of control

### Territory Benefits

Each territory type provides unique advantages:

- **Residential**: Recruitment pool, safe houses, information network
- **Commercial**: Revenue streams, money laundering opportunities
- **Industrial**: Manufacturing, weapon storage, vehicle modifications
- **Government**: Political influence, inside information, legal protection
- **Entertainment**: Social gathering, recruitment, reputation building
- **Transport Hub**: Movement control, smuggling routes, logistics
- **Financial**: Banking access, investment opportunities, economic warfare
- **Medical**: Healing services, drug production, organ trafficking
- **Educational**: Recruitment of specialists, research capabilities

## 🤝 Dynamic Relationship Matrix

### Relationship Types

```typescript
interface FactionRelationship {
  factionA: string;
  factionB: string;
  relationshipType: RelationType;
  strength: number; // -100 (enemy) to +100 (allied)
  publicKnown: boolean;
  secretAgreements: Agreement[];
  conflictHistory: ConflictEvent[];
  tradeAgreements: TradeAgreement[];
  lastInteraction: Date;
  trendDirection: 'improving' | 'stable' | 'deteriorating';
}

enum RelationType {
  ALLIED = 'allied',
  FRIENDLY = 'friendly',
  NEUTRAL = 'neutral',
  SUSPICIOUS = 'suspicious',
  HOSTILE = 'hostile',
  ENEMY = 'enemy',
  COLD_WAR = 'cold_war',
  SECRET_ALLIANCE = 'secret_alliance',
  BUSINESS_PARTNERS = 'business_partners',
  COMPETITORS = 'competitors',
}
```

### Relationship Evolution Rules

Relationships change based on:

1. **Direct Interactions** - Cooperation or conflict between factions
2. **Territory Disputes** - Competition for the same areas
3. **Economic Factors** - Trade agreements, business competition
4. **Player Actions** - Members' behavior affects faction standing
5. **External Pressures** - Law enforcement, other faction threats
6. **Ideological Compatibility** - Philosophical alignment or opposition

### Alliance and Betrayal Mechanics

```typescript
interface Alliance {
  id: string;
  participants: string[];
  type: AllianceType;
  purpose: string;
  duration: 'temporary' | 'indefinite' | 'permanent';
  terms: AllianceTerm[];
  secretTerms: SecretTerm[];
  stabilityScore: number;
  betrayalRisk: number;
  benefitDistribution: BenefitShare[];
  createdAt: Date;
  expiresAt?: Date;
}

enum AllianceType {
  MUTUAL_DEFENSE = 'mutual_defense',
  ECONOMIC_COOPERATION = 'economic_cooperation',
  TERRITORIAL_AGREEMENT = 'territorial_agreement',
  ANTI_FACTION_PACT = 'anti_faction_pact',
  TEMPORARY_CEASEFIRE = 'temporary_ceasefire',
  FULL_MERGER = 'full_merger',
}
```

## 💼 Faction Economy

### Economic Activities by Faction Type

#### Criminal Organizations

```typescript
interface CriminalEconomy {
  drugTrafficking: {
    productionSites: Location[];
    distributionNetwork: Territory[];
    monthlyRevenue: number;
    riskLevel: number;
  };
  weaponsTrafficking: {
    suppliers: string[];
    storage: Location[];
    clientBase: FactionClient[];
    profitMargin: number;
  };
  protection: {
    protectedBusinesses: Business[];
    monthlyFees: number;
    territoryRequired: Territory[];
  };
  humanTrafficking: {
    routes: TraffickingRoute[];
    operations: Operation[];
    riskVsReward: number;
  };
}
```

#### Government Factions

```typescript
interface GovernmentEconomy {
  budget: {
    totalBudget: number;
    allocations: BudgetAllocation[];
    federalFunding: number;
    localTaxes: number;
  };
  law_enforcement: {
    equipment: Equipment[];
    personnel: PersonnelCount;
    operationalCosts: number;
    effectiveness: number;
  };
  public_services: {
    infrastructure: InfrastructureProject[];
    socialPrograms: Program[];
    publicOpinion: number;
  };
}
```

#### Corporate Entities

```typescript
interface CorporateEconomy {
  legitimate_business: {
    revenue_streams: RevenueStream[];
    market_share: number;
    expansion_plans: ExpansionPlan[];
    competition: Competitor[];
  };
  investments: {
    portfolio: Investment[];
    real_estate: Property[];
    stocks: StockHolding[];
    roi: number;
  };
  lobbying: {
    political_influence: PoliticalContact[];
    regulatory_advantages: Advantage[];
    government_contracts: Contract[];
  };
}
```

## 🎖️ Faction Hierarchy and Ranks

### Rank Structure Example (Criminal Organization)

```typescript
interface FactionRank {
  id: string;
  name: string;
  level: number;
  permissions: Permission[];
  responsibilities: string[];
  salary: number;
  requirements: Requirement[];
  promotionCriteria: Criteria[];
}

const criminalHierarchy: FactionRank[] = [
  {
    name: 'Associate',
    level: 1,
    permissions: ['view_faction_info', 'participate_missions'],
    responsibilities: ['Follow orders', 'Maintain loyalty'],
    salary: 1000,
    requirements: ['Complete initiation', 'Sponsor by member'],
    promotionCriteria: ['Complete 5 missions', 'Demonstrate loyalty'],
  },
  {
    name: 'Soldier',
    level: 2,
    permissions: ['recruit_associates', 'access_weapons'],
    responsibilities: ['Execute operations', 'Protect territory'],
    salary: 2500,
    requirements: ['3 months as Associate', 'Combat skills'],
    promotionCriteria: ['Lead successful operation', 'Earn respect'],
  },
  {
    name: 'Lieutenant',
    level: 3,
    permissions: ['plan_operations', 'manage_territory'],
    responsibilities: ['Oversee soldiers', 'Report to captains'],
    salary: 5000,
    requirements: ['1 year as Soldier', 'Leadership skills'],
    promotionCriteria: ['Successful territory expansion', 'Crew loyalty'],
  },
  {
    name: 'Captain',
    level: 4,
    permissions: ['major_decisions', 'alliance_negotiations'],
    responsibilities: ['Strategic planning', 'Faction representation'],
    salary: 10000,
    requirements: ['2 years as Lieutenant', 'Strategic thinking'],
    promotionCriteria: ['Major successful operation', 'Boss approval'],
  },
  {
    name: 'Underboss',
    level: 5,
    permissions: ['faction_management', 'declare_war'],
    responsibilities: ['Daily operations', 'Boss advisory'],
    salary: 20000,
    requirements: ['3 years as Captain', 'Complete trust'],
    promotionCriteria: ['Exceptional service', 'Boss succession'],
  },
  {
    name: 'Boss',
    level: 6,
    permissions: ['all_permissions'],
    responsibilities: ['Ultimate decisions', 'Faction survival'],
    salary: 50000,
    requirements: ['Underboss experience', 'Faction vote/coup'],
    promotionCriteria: ['Faction leadership', 'Long-term success'],
  },
];
```

### Promotion and Demotion System

```typescript
interface PromotionEvaluation {
  playerId: string;
  currentRank: number;
  targetRank: number;
  criteria: EvaluationCriteria[];
  performance: PerformanceMetrics;
  loyalty: number;
  recommendation: string;
  aiAssessment: string;
  voteRequired: boolean;
  approvers: string[];
}

// AI-driven promotion evaluation
async function evaluatePromotion(
  playerId: string,
  factionId: string
): Promise<PromotionEvaluation> {
  const player = await getPlayer(playerId);
  const faction = await getFaction(factionId);
  const performance = await getPlayerPerformance(playerId, factionId);

  const prompt = `
    Evaluate ${player.name} for promotion in ${faction.name}.
    
    Current Performance:
    - Missions Completed: ${performance.missionsCompleted}
    - Success Rate: ${performance.successRate}%
    - Loyalty Score: ${performance.loyaltyScore}
    - Time in Current Rank: ${performance.timeInRank} days
    
    Consider faction values, recent activities, and potential for higher responsibility.
  `;

  const aiEvaluation = await aiClient.evaluate(prompt);
  return buildPromotionEvaluation(player, faction, performance, aiEvaluation);
}
```

## 🎯 Faction Missions and Operations

### Mission Categories by Faction

#### Criminal Faction Missions

1. **Territory Expansion**

   - Intimidate rival businesses
   - Establish protection rackets
   - Eliminate competition
   - Secure key locations

2. **Resource Acquisition**

   - Bank heists
   - Cargo theft
   - Drug lab raids
   - Weapon smuggling

3. **Information Warfare**

   - Corporate espionage
   - Police corruption
   - Witness elimination
   - Evidence destruction

4. **Faction Politics**
   - Alliance negotiations
   - Betrayal schemes
   - Leadership challenges
   - Territory deals

#### Government Faction Missions

1. **Law Enforcement**

   - Criminal investigations
   - Undercover operations
   - Raid planning
   - Evidence collection

2. **Public Safety**

   - Disaster response
   - Security details
   - Crowd control
   - Emergency services

3. **Intelligence Operations**

   - Surveillance missions
   - Informant management
   - Counter-intelligence
   - Information analysis

4. **Political Objectives**
   - Diplomatic negotiations
   - Policy implementation
   - Public relations
   - Corruption investigation

### Mission Generation Algorithm

```typescript
interface MissionGenerationContext {
  requestingFaction: string;
  targetFaction?: string;
  urgencyLevel: number;
  resourcesAvailable: number;
  territoryInvolved: string[];
  playerParticipants: string[];
  worldEvents: WorldEvent[];
  factionGoals: FactionGoal[];
}

async function generateFactionMission(
  context: MissionGenerationContext
): Promise<Mission> {
  const faction = await getFaction(context.requestingFaction);
  const relationships = await getFactionRelationships(faction.id);
  const capabilities = await assessFactionCapabilities(faction.id);

  const prompt = `
    Generate a mission for ${faction.name} (${faction.type}).
    
    Faction Status:
    - Current Goals: ${faction.currentGoals.join(', ')}
    - Resources: $${context.resourcesAvailable}
    - Territory: ${context.territoryInvolved.join(', ')}
    - Available Members: ${context.playerParticipants.length}
    
    Mission Requirements:
    - Urgency: ${context.urgencyLevel}/10
    - Should advance faction goals
    - Must be appropriate for faction type and values
    - Include clear objectives and success criteria
    - Consider potential opposition and risks
    
    Recent World Events:
    ${context.worldEvents.map(e => `- ${e.description}`).join('\n')}
  `;

  const missionDetails = await aiClient.generateMission(prompt);
  return await createMission(missionDetails, context);
}
```

## 🏛️ Faction Politics and Diplomacy

### Diplomatic Actions

```typescript
enum DiplomaticAction {
  ALLIANCE_PROPOSAL = 'alliance_proposal',
  TRADE_AGREEMENT = 'trade_agreement',
  TERRITORY_NEGOTIATION = 'territory_negotiation',
  CEASEFIRE_REQUEST = 'ceasefire_request',
  ULTIMATUM = 'ultimatum',
  INFORMATION_EXCHANGE = 'information_exchange',
  JOINT_OPERATION = 'joint_operation',
  MEDIATION_REQUEST = 'mediation_request',
}

interface DiplomaticEvent {
  id: string;
  initiator: string;
  target: string;
  action: DiplomaticAction;
  terms: DiplomaticTerm[];
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  deadline: Date;
  consequences: Consequence[];
  mediator?: string;
  publicKnowledge: boolean;
}
```

### Faction War System

```typescript
interface FactionWar {
  id: string;
  participants: WarParticipant[];
  causus_belli: string;
  warGoals: WarGoal[];
  startDate: Date;
  intensity: WarIntensity;
  territories: ContestedTerritory[];
  casualties: Casualty[];
  economicImpact: EconomicImpact;
  publicOpinion: PublicOpinion;
  mediationAttempts: MediationAttempt[];
  endConditions: EndCondition[];
}

enum WarIntensity {
  COLD_WAR = 'cold_war', // Information warfare, economic pressure
  LIMITED_CONFLICT = 'limited', // Small skirmishes, targeted attacks
  OPEN_WARFARE = 'open', // Full military engagement
  TOTAL_WAR = 'total', // All-out destruction
}
```

### Peace and Resolution Mechanics

AI-driven conflict resolution considers:

1. **War Exhaustion** - Resource depletion, member fatigue
2. **External Pressure** - Government intervention, other factions
3. **Economic Costs** - Financial sustainability of conflict
4. **Public Opinion** - Civilian support or opposition
5. **Strategic Goals** - Achievement of war objectives
6. **Diplomatic Solutions** - Face-saving compromises

## 📊 Faction Analytics and Metrics

### Performance Indicators

```typescript
interface FactionMetrics {
  strength: {
    memberCount: number;
    npcCount: number;
    averageLevel: number;
    combatEffectiveness: number;
  };
  territory: {
    controlledAreas: number;
    territoryValue: number;
    expansionRate: number;
    defensiveStrength: number;
  };
  economy: {
    monthlyRevenue: number;
    expenses: number;
    netProfit: number;
    economicGrowth: number;
  };
  influence: {
    politicalPower: number;
    publicOpinion: number;
    mediaPresence: number;
    fearRating: number;
  };
  relationships: {
    allyCount: number;
    enemyCount: number;
    neutralCount: number;
    diplomaticScore: number;
  };
}
```

### AI-Driven Faction Adaptation

```typescript
async function analyzeFactionPerformance(factionId: string): Promise<void> {
  const metrics = await calculateFactionMetrics(factionId);
  const trends = await analyzeTrends(factionId);
  const competitors = await getCompetitorAnalysis(factionId);

  const prompt = `
    Analyze the performance of faction ${factionId}.
    
    Current Metrics:
    ${JSON.stringify(metrics, null, 2)}
    
    Recent Trends:
    ${trends.map(t => `- ${t.metric}: ${t.direction} (${t.percentage}%)`).join('\n')}
    
    Competitor Analysis:
    ${competitors.map(c => `- ${c.name}: ${c.relativeStrength}`).join('\n')}
    
    Provide strategic recommendations for:
    1. Immediate tactical adjustments
    2. Medium-term strategic shifts
    3. Long-term faction evolution
    4. Risk mitigation strategies
    5. Opportunity identification
  `;

  const analysis = await aiClient.analyzePerformance(prompt);
  await implementFactionAdjustments(factionId, analysis);
}
```

## 🎮 Player Integration

### Faction Selection Process

New players choose factions through:

1. **Personality Assessment** - AI evaluates player preferences
2. **Skill Assessment** - Determines compatible faction roles
3. **World State Analysis** - Considers current faction needs
4. **Player Goals** - Matches ambitions with faction opportunities

### Faction Loyalty System

```typescript
interface PlayerLoyalty {
  playerId: string;
  factionId: string;
  loyaltyScore: number; // 0-100
  loyaltyHistory: LoyaltyEvent[];
  trustLevel: TrustLevel;
  betrayalRisk: number;
  contributions: Contribution[];
  benefits: Benefit[];
  lastActivity: Date;
}

enum TrustLevel {
  UNTRUSTED = 'untrusted',
  PROBATIONARY = 'probationary',
  TRUSTED = 'trusted',
  HIGHLY_TRUSTED = 'highly_trusted',
  INNER_CIRCLE = 'inner_circle',
}
```

### Cross-Faction Interactions

Players can:

- **Spy** for other factions (double agents)
- **Trade** information between factions
- **Negotiate** on behalf of their faction
- **Defect** under specific conditions
- **Form** personal relationships across faction lines

## 🔮 Future Faction Features

### Advanced AI Capabilities

1. **Faction Learning** - Adaptation based on success/failure patterns
2. **Predictive Planning** - Anticipating player and rival actions
3. **Emotional Intelligence** - Understanding player motivations
4. **Cultural Evolution** - Factions develop unique traditions and rituals

### Dynamic World Events

1. **Economic Crises** - Market crashes affecting all factions
2. **Natural Disasters** - Forcing temporary cooperation
3. **Political Changes** - New laws or government structures
4. **Technological Advances** - Shifting faction capabilities

### Player-Created Factions

Advanced players can:

- **Establish** new factions with AI guidance
- **Define** faction philosophy and methods
- **Recruit** AI NPCs as initial members
- **Compete** with established factions for resources and influence

This faction system creates a living, breathing political ecosystem where every
player action has consequences and every faction decision shapes the world's
future.
