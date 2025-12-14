# AutoOps AI

A goal-driven AI agent system that accepts user goals, breaks them into tasks, executes automated workflows, reflects on results, and improves future outputs.

## 🚀 Features

- **Goal Decomposition**: Breaks complex goals into actionable tasks
- **Automated Workflow Execution**: Kestra-powered orchestration
- **Oumi Agent Reasoning**: Simulated AI reasoning engine
- **Reflection & Learning**: Analyzes results to improve outputs
- **Real-time Progress Tracking**: Visual feedback on agent execution
- **Autonomy Mode**: Self-improving execution without human confirmation
- **Safety Validation**: Detects ambiguous/unsafe goals
- **Timeline Playback**: Step-by-step replay of agent decisions
- **Skill System**: Modular skills that can be enabled/disabled

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── agent/         # Agent execution endpoints
│   ├── dashboard/         # Main dashboard UI
│   └── page.tsx           # Landing page
├── lib/
│   ├── agent/             # Core agent logic
│   │   ├── agents/        # Individual agent implementations
│   │   │   ├── PlannerAgent.ts
│   │   │   ├── ExecutorAgent.ts
│   │   │   ├── ReflectionAgent.ts
│   │   │   └── OptimizerAgent.ts
│   │   ├── evaluation/    # Agent scoring & testing
│   │   ├── timeline/      # Decision playback
│   │   ├── confidence/    # Confidence scoring
│   │   ├── safety/        # Safety validation
│   │   ├── comparison/    # Plan comparison
│   │   ├── testing/       # Failure injection
│   │   ├── skills/        # Modular skill system
│   │   ├── memory/        # Agent memory system
│   │   ├── evolution/     # Strategy evolution
│   │   ├── failure/       # Failure handling
│   │   ├── persona/       # Agent personality
│   │   ├── reasoning/     # Reasoning tracer
│   │   └── oumi.ts        # Oumi reasoning simulation
│   ├── workflow/          # Kestra integration
│   └── types/             # TypeScript types
├── components/            # React components
└── workflows/             # Kestra YAML definitions
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Agent**: Simulated Oumi reasoning engine
- **Orchestration**: Kestra workflow definitions

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Usage

1. Enter a goal in the input field
2. Watch the agent break it into tasks
3. Monitor execution progress
4. Review results and reflections

## 📝 Example Goals

- "Create a data pipeline for user analytics"
- "Set up a CI/CD workflow for deployment"
- "Analyze customer feedback and generate insights"

---

## 🧠 Agent Breakdown

### PlannerAgent
- Analyzes user goal
- Breaks it into structured tasks
- Assigns confidence score

### ExecutorAgent
- Selects appropriate workflow
- Triggers Kestra execution
- Monitors status

### ReflectionAgent
- Analyzes outcomes
- Explains success/failure
- Generates insights

### OptimizerAgent
- Improves future plans
- Applies learned optimizations
- Evolves strategy over time

---

## ⚙️ Workflow Orchestration (Kestra)

- Workflows are defined declaratively using YAML
- Each workflow represents deterministic execution
- Supports retries, logging, and failure recovery
- Easily scalable to production environments

---

## 🚀 Deployment & Execution Architecture

### Frontend & API (Vercel)
- Built with **Next.js**
- Deployed on **Vercel**
- Serverless API routes handle agent execution
- Automatic CI/CD from GitHub

### Agent Runtime
- Multi-agent system runs in the API layer
- Stateless execution with session-level intelligence
- Memory and evaluation simulated for hackathon scope

### Workflow Engine (Kestra)
- Runs in local or containerized environment
- Triggered by agent decisions
- Returns execution status and logs

### Code Quality & Development
- **Cline** used for autonomous code generation
- **CodeRabbit** provides AI-based code review insights

---

## 🔐 Security & Configuration

- Secrets managed via environment variables
- No sensitive data committed
- Clean separation of concerns
- Safe-by-design goal validation

---

## 🧪 Manual Testing Guide

### Test 1: Basic Execution
**Goal:**  
Create a weekly operational report for a college club

✔ Task plan generated  
✔ Workflow executed  
✔ Reflection & evolution shown  

---

### Test 2: Autonomy Mode
- Enable autonomy mode
- Enter any valid goal

✔ No confirmations required  
✔ Optimizations applied automatically  

---

### Test 3: Failure & Recovery
- Enable failure simulation
- Run complex goal

✔ Failure detected  
✔ Retry attempted  
✔ Recovery plan generated  

---

### Test 4: Learning & Evolution
- Run the same goal twice

✔ Second execution is optimized  
✔ Evaluation score improves  

---

### Test 5: Safety Handling
**Goal:**  
Do everything for the project

✔ Agent requests clarification  
✔ No unsafe execution triggered  

---

## 📊 Evaluation & Metrics

Each agent run is evaluated on:
- Planning quality
- Execution reliability
- Optimization effectiveness
- Confidence level

Scores are displayed in the dashboard to ensure transparency and accountability.

---

## 🧠 Why This Is an AI Agent (Not a Chatbot)

- It **plans**, not just responds
- It **executes workflows**, not just suggests
- It **evaluates outcomes**
- It **learns and improves**
- It **operates autonomously**

---

## 🧪 Tech Stack

| Category | Technology |
|------|-----------|
| Frontend | Next.js, Tailwind CSS |
| Deployment | Vercel |
| Agent Reasoning | Oumi-style architecture |
| Orchestration | Kestra |
| Code Generation | Cline |
| Code Review | CodeRabbit |
| Language | TypeScript |

---

## 🔮 Future Scope

- Persistent memory (database-backed)
- Multi-agent collaboration across teams
- Real integrations (email, calendar, Slack)
- Cloud-hosted Kestra workflows
- Agent skill marketplace

---

## 🏆 Hackathon Focus

This project prioritizes:
- Autonomous intelligence
- Real-world applicability
- Explainability & safety
- Clean architecture
- Strong UX & communication

---

## 📌 Final Note

> AutoOps AI demonstrates how modern AI agents can move beyond prompts to become autonomous, reliable, and self-improving systems capable of managing real operational workflows.

---

**Built for the AI Agent Hackathon using Cline, Kestra, Vercel, Oumi, and CodeRabbit.**
