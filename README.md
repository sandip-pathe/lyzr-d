<div align="center">

# 🎯 Agentic Orchestration Builder

### Visual, Event-Driven AI Workflow Orchestration Platform

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-lyzr.anaya.legal-00d4ff?style=for-the-badge)](https://lyzr-alpha.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/sandip-pathe/lyzr)

**Built in 6 days** | Complex AI workflows that feel like magic ✨

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Demo](#-live-demo)

</div>



## 🎬 Live Demo

**🌐 Try it now:** [lyzr-alpha.vercel.app](https://lyzr-alpha.vercel.app/)

> Experience the full power of hybrid AI-agentic orchestration with our live deployment. Build, execute, and monitor complex workflows in real-time.



## 💡 The Problem & Our Solution

### ⚠️ The Challenge
Existing workflow tools (Airflow, n8n, Zapier) are built for **predictable, deterministic tasks**. They fail when dealing with the **non-deterministic, adaptive nature** of modern AI agents.

### ✨ Our Approach
A **hybrid orchestrator** combining:
- ✅ **Reliability** of deterministic workflow engines (Temporal)
- ⚡ **Flexibility** of event-driven architecture (Redis Pub/Sub)
- 🎯 **Single, auditable workflow** for both traditional logic and intelligent AI agents

### 🏆 The Result
A full-stack platform that orchestrates **both deterministic and non-deterministic AI workflows** with:
- 🎨 Visual canvas for workflow design
- 🤖 Multi-model AI agent support
- 👤 Human-in-the-loop approval steps
- 📊 Real-time state management
- 🔍 Complete observability



## 🏗️ Architecture

### System Overview

```mermaid
graph TD
    subgraph Frontend
        A[React Flow Canvas] --> B{Run Workflow}
        B --> C[RunWorkflowModal]
        C --> D{Execute}
        D --> E[useMutation]
    end
    
    subgraph "API Layer"
        F[FastAPI Server] --> G[Workflow Controller]
        G --> H["/execute"]
    end
    
    subgraph "Execution Engine"
        I[Temporal Worker] --> J[OrchestrationWorkflow]
        J --> K[Activity Execution]
    end
    
    subgraph Infrastructure
        L[Redis Pub/Sub] --> M[Event Dispatcher]
        N[PostgreSQL] --> O[State Store]
        P[Agent APIs] --> Q[Decision Engine]
    end
    
    subgraph "Real-time Updates"
        R[WebSocket Client] --> S[useWorkflowWebSocket]
        S --> T[EventLogStream]
        S --> U[OutputSidebar]
    end
    
    E --> H
    H --> J
    J --> L
    K --> P
    M --> R
```


### 🔄 Data Flow

```
User Design → FastAPI → Temporal → AI Agent → Redis Event → WebSocket → Real-time UI Update
```

1. **Design:** Visual workflow creation on React Flow canvas
2. **Execute:** Workflow sent to FastAPI backend with input data
3. **Orchestrate:** Temporal creates durable execution instance
4. **Process:** Worker executes AI Agent nodes (GPT-4o, Lyzr, custom agents)
5. **Event:** Task completion published to Redis Pub/Sub
6. **Monitor:** Frontend receives WebSocket events, updates canvas in real-time
7. **HITL:** Workflow pauses for human approval when needed
8. **Resume:** Approved workflows continue to completion



## ✨ Key Features


### 🎨 Visual Builder
Drag-and-drop canvas powered by **React Flow** for intuitive workflow design

### 🔀 Hybrid Orchestration
Seamlessly blend deterministic nodes (HTTP, timers) with non-deterministic AI agents

### 👥 Human-in-the-Loop
Pause workflows for critical approvals via Slack, email, or web interface

</td>
<td width="50%">

### 📊 Real-time Monitoring
Live event streaming via WebSockets with complete execution visibility

### 📈 Agent Metrics
Track performance, latency, reliability, and cost per execution

### 💾 Durable Execution
Temporal-powered stateful workflows with full auditability and replay capability

</td>
</tr>
</table>



## 🛠️ Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React Flow](https://img.shields.io/badge/React_Flow-FF0072?style=for-the-badge&logo=react&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Temporal](https://img.shields.io/badge/Temporal-000000?style=for-the-badge&logo=temporal&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

### AI & Infrastructure
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)

**Optimized for:** Reliability • Composability • Low Latency


## 🚀 Vision Beyond the Hackathon

This prototype is the foundation for a **no-code orchestration layer for enterprise AI workflows**.

### Roadmap
- 🏢 **Multi-tenant Architecture:** Isolation and security for enterprise deployments
- 📚 **Version Control:** Git-like workflow versioning and rollback
- 🎨 **Template Library:** Pre-built agent workflows for common business processes
- 🔌 **Plugin Ecosystem:** Community-contributed nodes and integrations
- 🌐 **Global Deployment:** Edge execution for latency-sensitive workflows

**Think:** Zapier meets LangChain, with enterprise-grade auditability and durability.




## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Installation

```bash
# Clone the repository
git clone https://github.com/sandip-pathe/lyzr.git
cd lyzr

# Configure environment variables
cp .env.example .env
# Edit .env with your database, Redis, Temporal, and AI model credentials

# Launch the platform
docker-compose up --build
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://localhost:3000` | Visual workflow builder & dashboard |
| **Backend API** | `http://localhost:8000/docs` | Interactive API documentation |
| **Temporal UI** | `http://localhost:8088` | Workflow execution monitoring |



## 🎯 Why It's Different

> Every AI orchestration platform focuses on the **agents themselves**. We focus on the **coordination logic** — the missing layer between intelligence and execution.

### Our Unique Approach
- 🎯 **Agents as Components:** Treat AI agents as powerful but unpredictable units within a reliable framework
- 🔧 **Reliability First:** Deterministic orchestration for non-deterministic AI
- 📊 **Full Observability:** No black boxes — see every step, every decision
- 🏢 **Enterprise-Ready:** Auditability, durability, and compliance built-in


## 👨‍💻 Team & Credits

**Solo Build** by [Sandip Pathe](https://github.com/sandip-pathe)

Built in **6 days** with:
- ☕ Lots of coffee
- 🎵 Late-night coding sessions
- 💪 Passion for robust AI systems



## 📝 License

>© 2025 Sandip Pathe – All rights reserved. For evaluation and demonstration only.

---

<div align="center">

### ⭐ Star this repo if you find it useful!

**Built with ❤️ for the future of AI orchestration**

[![GitHub Stars](https://img.shields.io/github/stars/sandip-pathe/lyzr?style=social)](https://github.com/sandip-pathe/lyzr)
[![GitHub Forks](https://img.shields.io/github/forks/sandip-pathe/lyzr?style=social)](https://github.com/sandip-pathe/lyzr/fork)

[🚀 Live Demo](https://lyzr-alpha.vercel.app/) • [📖 Documentation](#) • [🐛 Report Bug](#) • [💡 Request Feature](#)

</div>