// Behaviour tests for the readback gate.
//
// These read action.yml and execute the script it actually ships, rather than a
// copy. A copy would drift the first time someone edited one and not the other,
// and a test that agrees with a stale copy is worse than no test.
//
// Zero dependencies, by the same rule the action follows: node:test and
// node:assert are built in, and the block-scalar reader below is a dozen lines,
// which is cheaper than a YAML parser in the tree.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ACTION = path.join(__dirname, "..", "action.yml");

function extractScript(yamlText) {
  const lines = yamlText.split("\n");
  const start = lines.findIndex((line) => /^\s*script:\s*\|\s*$/.test(line));
  assert.notStrictEqual(start, -1, "no `script: |` block found in action.yml");

  const parentIndent = lines[start].match(/^\s*/)[0].length;
  const block = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === "") {
      block.push("");
      continue;
    }
    if (lines[i].match(/^\s*/)[0].length <= parentIndent) break;
    block.push(lines[i]);
  }

  const indent = Math.min(
    ...block
      .filter((line) => line !== "")
      .map((line) => line.match(/^\s*/)[0].length),
  );
  return block.map((line) => line.slice(indent)).join("\n");
}

const SCRIPT = extractScript(fs.readFileSync(ACTION, "utf8"));

const DEFAULTS = {
  READBACK_BASE_BRANCH: "main",
  READBACK_REVIEW_LABEL: "I have reviewed my own changes",
  READBACK_ATTRIBUTION_LABELS:
    "Human-authored\nAgent-assisted\nAgent-authored\n",
  READBACK_GUIDANCE: "",
};

// Runs the shipped script against a synthetic pull request. Returns the failure
// message, or null when the gate was satisfied.
async function readback({ env = {}, pullRequest }) {
  let failure = null;
  const core = {
    setFailed: (message) => {
      failure = message;
    },
    info: () => {},
  };
  const context = {
    payload: pullRequest === undefined ? {} : { pull_request: pullRequest },
  };
  const fakeProcess = { env: { ...DEFAULTS, ...env } };

  const run = new Function(
    "core",
    "context",
    "process",
    `return (async () => {\n${SCRIPT}\n})();`,
  );
  await run(core, context, fakeProcess);
  return failure;
}

// A pull request body in the shape the template produces.
function body({ attribution = "agent-authored", reviewed = false } = {}) {
  const tick = (name) => (attribution === name ? "x" : " ");
  return [
    "## Attribution",
    "",
    `- [${tick("human-authored")}] **Human-authored.** No coding agent involved.`,
    `- [${tick("agent-assisted")}] **Agent-assisted.** A human directed the work.`,
    `- [${tick("agent-authored")}] **Agent-authored.** An agent produced the changes.`,
    "",
    "## Human review",
    "",
    `- [${reviewed ? "x" : " "}] I have reviewed my own changes.`,
    "",
  ].join("\n");
}

const pr = (overrides) => ({
  draft: true,
  base: { ref: "main" },
  body: body(),
  ...overrides,
});

// --- The coupling, which is the whole point ------------------------------

test("draft and unticked is the normal state, and passes", async () => {
  assert.strictEqual(
    await readback({ pullRequest: pr({ draft: true }) }),
    null,
  );
});

test("ticked while still a draft fails", async () => {
  const failure = await readback({
    pullRequest: pr({ draft: true, body: body({ reviewed: true }) }),
  });
  assert.match(failure, /ticked on a draft/);
});

test("ready for review and ticked passes", async () => {
  const result = await readback({
    pullRequest: pr({ draft: false, body: body({ reviewed: true }) }),
  });
  assert.strictEqual(result, null);
});

test("ready for review and unticked fails", async () => {
  const failure = await readback({
    pullRequest: pr({ draft: false, body: body({ reviewed: false }) }),
  });
  assert.match(failure, /not ticked/);
});

// --- Attribution ----------------------------------------------------------

test("no attribution ticked fails", async () => {
  const failure = await readback({
    pullRequest: pr({ body: body({ attribution: "none" }) }),
  });
  assert.match(failure, /No attribution selected/);
});

test("two attributions ticked fails", async () => {
  const twoTicked = body({ attribution: "human-authored" }).replace(
    "- [ ] **Agent-assisted",
    "- [x] **Agent-assisted",
  );
  const failure = await readback({ pullRequest: pr({ body: twoTicked }) });
  assert.match(failure, /Multiple attribution boxes ticked/);
});

test("attribution can be disabled with an empty label list", async () => {
  const result = await readback({
    env: { READBACK_ATTRIBUTION_LABELS: "" },
    pullRequest: pr({ body: body({ attribution: "none" }) }),
  });
  assert.strictEqual(result, null);
});

test("attribution labels may be comma separated", async () => {
  const result = await readback({
    env: { READBACK_ATTRIBUTION_LABELS: "Human-authored, Agent-authored" },
    pullRequest: pr({ body: body({ attribution: "agent-authored" }) }),
  });
  assert.strictEqual(result, null);
});

// --- Scope ----------------------------------------------------------------

test("a pull request targeting another branch is not gated", async () => {
  const result = await readback({
    pullRequest: pr({
      draft: false,
      base: { ref: "develop" },
      body: body({ attribution: "none" }),
    }),
  });
  assert.strictEqual(result, null);
});

test("an empty base-branch gates every branch", async () => {
  const failure = await readback({
    env: { READBACK_BASE_BRANCH: "" },
    pullRequest: pr({
      draft: false,
      base: { ref: "develop" },
      body: body({ attribution: "none" }),
    }),
  });
  assert.match(failure, /No attribution selected/);
});

// --- Inputs that could break it -------------------------------------------

test("a label containing regex metacharacters is matched literally", async () => {
  const result = await readback({
    env: {
      READBACK_REVIEW_LABEL: "I read it (really)",
      READBACK_ATTRIBUTION_LABELS: "",
    },
    pullRequest: pr({ draft: false, body: "- [x] I read it (really)\n" }),
  });
  assert.strictEqual(result, null);
});

test("an empty body fails rather than passing by default", async () => {
  const failure = await readback({
    pullRequest: pr({ draft: false, body: "" }),
  });
  assert.ok(failure);
});

test("a null body does not throw", async () => {
  const failure = await readback({ pullRequest: pr({ body: null }) });
  assert.ok(failure);
});

test("guidance is appended to a failure message when set", async () => {
  const failure = await readback({
    env: { READBACK_GUIDANCE: "See CONTRIBUTING.md." },
    pullRequest: pr({ body: body({ attribution: "none" }) }),
  });
  assert.match(failure, /See CONTRIBUTING\.md\./);
});

test("an event with no pull request fails instead of crashing", async () => {
  const failure = await readback({ pullRequest: undefined });
  assert.match(failure, /needs a pull request/);
});
