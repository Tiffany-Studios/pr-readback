## What this changes

<!-- One or two sentences. Say what changed, what you left out, and what you are unsure
about. Do not restate the diff. -->

## Attribution

Tick exactly one. `gate.yml` runs this repository's own action against this pull request,
so an unticked or double-ticked section fails the check.

- [ ] **Human-authored.** No coding agent involved.
- [ ] **Agent-assisted.** A human directed the work and wrote or substantially shaped the
      result.
- [ ] **Agent-authored.** An agent produced the changes.

Tool used (if any):

## Human review

**Agents must not tick this box.** It is a human's statement about their own reading of
the diff, and an agent ticking it makes the artifact a lie. Open as a draft and leave it
alone; a human reads the changes, ticks the box, and promotes the pull request.

Ticking it while this is still a draft fails the check. So does leaving it unticked once
the pull request is ready for review. That coupling is the thing this repository exists to
provide, so it is worth living with here first.

- [ ] I have reviewed my own changes.

## Checks

- [ ] `node --test test/*.test.js` passes
- [ ] Behaviour changes are covered by a test that reads `action.yml`, not a copy of it
- [ ] `README.md` still describes what the action does, including any new input
