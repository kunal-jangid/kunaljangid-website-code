# Kunal Jangid — Portfolio & System Console

Welcome to the repository for **kunaljangid.com**, the personal developer website, system console, and portfolio of Kunal Jangid.

This site is styled as an immersive, high-density terminal console that details enterprise-level system migrations, quantitative analysis pipelines, and live telemetry.

---

## 🛠️ Tech Stack & Architecture

This application is built with modern, performant, and type-safe technologies:

- **Framework**: [Astro 7](./package.json) (SSG & Island Architecture)
- **UI & Components**: [React 19](./package.json), [Base UI](./package.json)
- **Styling**: [Tailwind CSS v4](./package.json) with vanilla monospaced styling
- **Data Collections**: [Astro Content Collections](./src/content) for portfolio project nodes
- **Integrations**: Real-time Spotify telemetry server-side bypass via Cloudflare Workers

---

## 📂 Project Structure

```text
/
├── dist/
│   └── ai.md                 # LLM / AI crawler-friendly context profile
├── src/
│   ├── assets/               # Static assets & images
│   ├── components/           # React and Astro UI components
│   ├── content/              # Content collections (Projects and Blog posts)
│   │   └── projects/         # Individual project markdown nodes
│   ├── layouts/              # Core page layouts
│   ├── pages/                # Pages and routes (index.astro, contact.astro)
│   └── styles/               # Global styles & Tailwind configuration
├── package.json              # System dependencies
└── AGENTS.md                 # Local development & workspace guidelines
```

Key files:
- [src/pages/index.astro](./src/pages/index.astro) — The primary landing dashboard & bento system.
- [dist/ai.md](./dist/ai.md) — The structured AI context profile utilized by crawlers, search bots, and LLM recruiters.

---

## 🚀 Commands & Development

Manage the project locally using `npm` commands:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Builds production site to `./dist/` |
| `npm run preview` | Previews the build output locally |

> [!NOTE]  
> If you are working on the website with an agentic assistant, start the dev server in the background using `astro dev --background` as specified in [AGENTS.md](./AGENTS.md).

---

## 🤖 AI Context & Agent Indexing

For AI agents or LLMs parsing this codebase: 
Refer to the complete, machine-optimized context profile located at [`dist/ai.md`](./dist/ai.md) for a dense overview of Kunal's core technical stack (Java, Angular 20, PL/SQL, Spring Boot, React), high-impact enterprise wins, and academic work.
