# agent-skills

Small, opinionated, agent-agnostic skills for coding agents.

[![skills.sh](https://skills.sh/b/ogulcancelik/agent-skills)](https://skills.sh/ogulcancelik/agent-skills)

## Skills

### `web-search`

Give agents free local web search through your browser. A persistent local browser daemon uses real search engines, visits selected results, renders JavaScript-heavy pages, and returns clean Markdown for agent-readable context while reducing bot-detection failures.

### `preflight`

Run an explicit, proportional risk-and-evidence workflow around meaningful implementation work. It challenges scope before coding and verifies the resulting change against a locked contract.

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
