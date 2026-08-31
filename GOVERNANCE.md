# Governance

> How decisions are made in the FED-Shell project.

## Current state

FED-Shell is a **BDFL-style** (Benevolent Dictator For Life) project
maintained by **Fedpromptly**. It is small, focused, and part of the
FED-OS ecosystem. Governance is deliberately lightweight.

## Decision-making

| Decision type | Who decides | How |
|---|---|---|
| Bug fixes | Maintainer | PR + self-review |
| New features | Maintainer | Proposal in issues/forum → PR |
| Architecture changes | Maintainer | Documented in `ADR.md` → PR |
| Breaking changes | Maintainer | Discussion first → `ROADMAP.md` → PR |
| Release tagging | Maintainer | Semantic versioning |

The maintainer has final say but actively seeks community input via issues
and the [forum](https://www.fedpromptly.com/forum).

## How to propose a change

1. **Small fix** — open a PR directly (see `CONTRIBUTING.md`)
2. **New feature** — open a feature request issue first, discuss, then PR
3. **Architecture change** — propose it, and if accepted it gets recorded in `ADR.md`
4. **Roadmap item** — discuss on the forum; if it fits the vision, it goes in `ROADMAP.md`

## Principles that guide decisions

1. **Sovereignty first** — no mandatory dependencies on corporate services
2. **One URL, all platforms** — the core promise must never break
3. **Inject, don't fork** — keep the single-engine design
4. **Parallel by default** — don't make jobs sequential unless necessary
5. **Free and open** — the core tool stays MIT-licensed and free

## Conflict resolution

Disagreements happen. The process:

1. Discuss in the issue or PR respectfully
2. If unresolved, take it to the [forum](https://www.fedpromptly.com/forum) for wider input
3. The maintainer makes a final decision, explaining the reasoning
4. If the maintainer is wrong, a future PR can reverse it — the code is the truth

## Succession

If the maintainer becomes inactive for an extended period, contributors with
the most merged PRs and deepest understanding of the injection architecture
are the natural successors. The FED-OS GitHub org controls the repo.

## Code of Conduct

All participants must follow `CODE_OF_CONDUCT.md`. Enforcement is the
maintainer's responsibility.
