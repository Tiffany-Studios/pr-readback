# Contributing

Small repository, small rules.

## The gate applies here too

`main` requires a pull request, one approving review, and both checks green. Nobody
bypasses it, administrators included. Only a reviewer with write access can give an
approval that counts, so the review is a second person by construction.

This repository runs its own action against its own pull requests. If the gate is worth
asking anyone else to adopt, it is worth living with. That means:

- **Open as a draft** and leave the review box unticked. A box ticked on a draft fails the
  check, deliberately.
- **Tick exactly one attribution box.** None or two fails the check.
- A human reads the diff, ticks the box, and promotes the pull request to ready for
  review. An agent must not tick it — it is a statement about a human's own reading, and
  an agent ticking it makes the artifact a lie.

## Tests

```bash
node --test test/*.test.js
```

No dependencies to install. The tests read `action.yml` and execute the script it actually
ships, extracted at run time rather than copied. **Keep it that way.** A copied script
drifts the first time someone edits one and not the other, and a test that agrees with a
stale copy is worse than no test.

Behaviour changes need a test. Input changes need a test and a row in the README table.

## Scope

This action does one thing: check a pull request body's checkboxes against the pull
request's draft state. Things that are out of scope, so nobody spends an afternoon on
them:

- calling the GitHub API — it reads the event payload and nothing else
- posting comments, adding labels, or otherwise writing to the pull request
- any dependency at all

If you want one of those, it is a different action and it can call this one.

## Prior art

The README credits prior art by name and claims no invention. Author self-attestation is
not novel, and neither is coupling the box to "ready for review". If you know of prior art
for the other half — failing a box ticked while the pull request is still a draft — please
open an issue. We would rather cite it than claim it.
