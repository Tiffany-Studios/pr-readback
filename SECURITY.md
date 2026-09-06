# Security policy

## Reporting

Email **derektiffany@live.com**, or open a private vulnerability report through GitHub's
Security tab if it is enabled on this repository.

Please do not open a public issue for something exploitable. For anything else — a bug, a
false positive, a gate that fires when it should not — a public issue is the right place
and is preferred.

Expect a reply within a week. This is a small project maintained by two people; it is not
staffed, and saying so is more useful than promising a response time nobody is on call
for.

## First, what this action is not

**It is not a security control**, and a report treating it as one is likely to be closed
as working-as-intended rather than fixed.

The action checks that a checkbox in a pull request body agrees with that pull request's
draft state. A checkbox is an attestation. Anyone with write access can tick it, including
an agent running under a maintainer's credential. That is stated plainly in the README and
it is the design, not a weakness.

The controls that actually bite are elsewhere: GitHub refusing to merge a draft pull
request, and a ruleset requiring an approving review the author cannot give themselves.
This action makes a norm explicit and catches the honest mistake.

## What would be a real vulnerability

The action's actual attack surface is small, and it is worth naming so reports can be
aimed well:

- **Code execution from untrusted input.** Caller-supplied values reach the script through
  the environment rather than by expression interpolation, and label text is escaped
  before it is used in a regular expression. A way around either of those is a genuine
  finding.
- **A crafted pull request body that defeats the check** — text that causes a ticked box
  to read as unticked, or the reverse. That is the one thing the action claims to do.
- **Reading anything it should not.** It reads `context.payload.pull_request` and makes no
  API calls, so it should never touch repository contents, secrets, or another
  repository's data.
- **Requiring more permission than it needs.** It runs with `contents: read` and
  `pull-requests: read`. Anything that makes a broader token necessary is a bug.

## Supported versions

The `v1` tag tracks the latest `v1.x.y` release, and fixes land there. Older patch tags
are left in place as history and are not updated.

| Version  | Supported         |
| -------- | ----------------- |
| `v1`     | Yes               |
| `v1.0.x` | Latest patch only |

## Dependencies

There are none. The action is a single composite step running `actions/github-script`,
with no package manifest, no lockfile, and nothing installed at runtime. There is no
dependency tree to audit, which is deliberate.
