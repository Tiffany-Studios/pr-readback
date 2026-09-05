# pr-readback

A pull request gate for the claim "I have read my own diff."

The author ticks a box saying they reviewed their own changes. This action checks that
box against the pull request's draft state, in **both** directions:

- **Ticked while the pull request is still a draft** fails. The claim describes finished,
  reviewed work; a draft says the opposite.
- **Unticked once the pull request is ready for review** fails. Nobody has claimed to
  have read it.

Optionally it also requires exactly one attribution box — who or what wrote the change.

Zero dependencies. One file. It reads the pull request body out of the event payload and
never calls the API.

## Why "readback"

In aviation and medicine, a **readback** is the protocol where the receiver repeats an
instruction back to prove they _understood_ it, not merely received it.

That is the distinction this gate asserts. A read receipt would be the wrong name: an
email read receipt is automatic and proves delivery, not comprehension — the opposite of
the claim being made here.

## Use it

### As an action, on a job you already have

This is the form to prefer. A step keeps your job name, and therefore your **check name**,
under your control — which matters if you are wiring this to a required status check.

```yaml
name: pr-policy

on:
  pull_request:
    types:
      [
        opened,
        edited,
        synchronize,
        reopened,
        ready_for_review,
        converted_to_draft,
      ]

permissions:
  contents: read
  pull-requests: read

jobs:
  policy:
    name: human gate for main # this string becomes your check name
    runs-on: ubuntu-latest
    steps:
      - uses: Tiffany-Studios/pr-readback@v1
        with:
          guidance: See CONTRIBUTING.md.
```

### As a reusable workflow

Less to write, but note that GitHub names a reusable workflow's check
`caller / callee` — two parts, and you do not fully control it.

```yaml
jobs:
  readback:
    uses: Tiffany-Studios/pr-readback/.github/workflows/pr-readback.yml@v1
```

## Inputs

| Input                | Default                          | Meaning                                                                                |
| -------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| `base-branch`        | `main`                           | Gate only pull requests targeting this branch. Empty gates all.                        |
| `review-label`       | `I have reviewed my own changes` | Text identifying the self-attestation checkbox.                                        |
| `attribution-labels` | three labels, see below          | One per line or comma separated; exactly one must be ticked. Empty disables the check. |
| `guidance`           | `""`                             | A sentence appended to any failure message, pointing at your docs.                     |

The default `attribution-labels` are `Human-authored`, `Agent-assisted` and
`Agent-authored`. A list item counts as ticked when it matches `- [x]` and then contains
the label text, so these work with an ordinary pull request template.

Caller-supplied text reaches the script through the environment, never by interpolation,
and labels are escaped before they reach a regular expression.

## What this is not

**It is not a security control.** A checkbox in a pull request body is an attestation.
Anyone with write access can tick it, including an agent running under a maintainer's
credential.

The controls that actually bite are elsewhere: GitHub refuses to merge a draft pull
request, and a ruleset can require an approving review that an author cannot give
themselves. This action makes the process legible and catches the honest mistake. Pair
it with those; do not substitute it for them.

## Prior art

Nothing here is claimed as invented. Two prior-art sweeps were run before publishing, and
the second overturned the first on the points that matter.

- **Author self-attestation is not novel.**
  [`kylecorry31/Trail-Sense`](https://github.com/kylecorry31/Trail-Sense) has enforced
  "I have manually reviewed my code changes" since 2026-08-22, and at least two other
  repositories arrived at the same thing independently.
- **Coupling the box to "ready for review" is not novel either.**
  [`treeseed-ai/agent`](https://github.com/treeseed-ai/agent) enforced "ready implies
  ticked" from 2026-08-19, together with a three-way attribution taxonomy.
- The lineage runs back further, to the
  [Developer Certificate of Origin](https://developercertificate.org/): a machine-checked
  assertion by an author about their own contribution.

What we did not find in any repository we searched is the **other** half of the coupling —
failing a box that is ticked _while the pull request is still a draft_ — and no one
appears to have packaged either half as a standalone reusable Action. That packaging, and
the bidirectional coupling, is what this repository offers. If you know of prior art for
it, please open an issue; we would rather cite it than claim it.

## Development

```bash
node --test test/*.test.js
```

The tests read `action.yml` and execute the script it actually ships, rather than a copy
that could drift from it. No dependencies to install.

## Licence

MIT. See [LICENSE](LICENSE).

The action is used by [SpaceDonkey](https://github.com/Tiffany-Studios/SpaceDonkey),
where it started life, and by this repository on itself.
