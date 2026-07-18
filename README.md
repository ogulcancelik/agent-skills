# agent-skills

Small, opinionated, agent-agnostic skills for coding agents.

## Skills

### `web-search`

Give agents free local web search through your browser. A persistent local browser daemon uses real search engines, visits selected results, renders JavaScript-heavy pages, and returns clean Markdown for agent-readable context while reducing bot-detection failures.

### `preflight`

Run an explicit, proportional risk-and-evidence workflow around meaningful implementation work. It challenges scope before coding and verifies the resulting change against a locked contract.

> **Note:** `preflight` is still experimental. I'm still exploring the right shape for the workflow, so it may change significantly.

## Install

Install the collection:

```bash
npx skills add ogulcancelik/agent-skills
```

Install one skill:

```bash
npx skills add ogulcancelik/agent-skills --skill web-search
npx skills add ogulcancelik/agent-skills --skill preflight
```

Skills follow the [Agent Skills](https://agentskills.io/) format.

## License

MIT
