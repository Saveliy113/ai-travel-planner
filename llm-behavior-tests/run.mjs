#!/usr/bin/env node

// LLM Behavior Tests — entry point.
// Loads scenarios from `./scenarios/*.mjs`, filters by --suite / --grep,
// runs them sequentially and reports a compact summary.

import process from "node:process";

import { BASE_URLS, REQUEST_TIMEOUT_MS, RUN_E2E_PLAN_TESTS, SUITES } from "./lib/config.mjs";
import { tests as positiveTests } from "./scenarios/positive.mjs";
import { tests as negativeTests } from "./scenarios/negative.mjs";
import { tests as edgeTests } from "./scenarios/edge.mjs";
import { tests as adversarialTests } from "./scenarios/adversarial.mjs";

const ALL_TESTS = [...positiveTests, ...negativeTests, ...edgeTests, ...adversarialTests];

function parseArgs(argv) {
  const args = { suite: "all", grep: null, bail: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    switch (token) {
      case "--suite":
        args.suite = argv[++i];
        break;
      case "--grep":
        args.grep = argv[++i];
        break;
      case "--bail":
        args.bail = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        if (token.startsWith("--")) {
          args.unknown = token;
        }
    }
  }
  return args;
}

function printUsageAndExit(code = 0) {
  process.stdout.write(
    [
      "Usage: node run.mjs [--suite all|positive|negative|edge|adversarial]",
      "                    [--grep <pattern>] [--bail]",
      "",
      "Environment:",
      "  BEHAVIOR_TEST_PLANNER_BASE_URL    default http://localhost:7016/api/v1",
      "  BEHAVIOR_TEST_LOCATION_BASE_URL   default http://localhost:7019/api/v1",
      "  BEHAVIOR_TEST_ITINERARY_BASE_URL  default http://localhost:7020/api/v1",
      "  BEHAVIOR_TEST_WEATHER_BASE_URL    default http://localhost:7018/api/v1",
      "  BEHAVIOR_TEST_TIMEOUT_MS          default 120000",
      "  BEHAVIOR_TEST_WS_TIMEOUT_MS       default 480000",
      "  BEHAVIOR_TEST_RUN_E2E_PLAN        '1' enables the full WS plan test",
      "",
    ].join("\n"),
  );
  process.exit(code);
}

function selectTests({ suite, grep }) {
  let selected = ALL_TESTS;
  if (suite !== "all") selected = selected.filter((t) => t.suite === suite);
  if (grep) {
    const re = new RegExp(grep, "i");
    selected = selected.filter((t) => re.test(t.name));
  }
  return selected;
}

function printHeader({ suite, grep, total }) {
  const suiteLabel = suite === "all" ? "all suites" : `suite: ${suite}`;
  const grepLabel = grep ? ` · grep: /${grep}/i` : "";
  process.stdout.write(`\nLLM behavior tests · ${suiteLabel}${grepLabel}\n`);
  process.stdout.write(`planner:   ${BASE_URLS.planner}\n`);
  process.stdout.write(`location:  ${BASE_URLS.location}\n`);
  process.stdout.write(`itinerary: ${BASE_URLS.itinerary}\n`);
  process.stdout.write(`weather:   ${BASE_URLS.weather}\n`);
  process.stdout.write(`timeout:   ${REQUEST_TIMEOUT_MS}ms\n`);
  process.stdout.write(`e2e plan:  ${RUN_E2E_PLAN_TESTS ? "ON" : "OFF (set BEHAVIOR_TEST_RUN_E2E_PLAN=1 to enable)"}\n`);
  process.stdout.write(`total:     ${total} test(s)\n\n`);
}

function fmtDuration(ms) {
  if (ms < 1_000) return `${ms}ms`;
  return `${(ms / 1_000).toFixed(2)}s`;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) printUsageAndExit(0);
  if (args.unknown) {
    process.stderr.write(`Unknown argument: ${args.unknown}\n`);
    printUsageAndExit(2);
  }
  if (args.suite !== "all" && !SUITES.includes(args.suite)) {
    process.stderr.write(`Unknown suite: ${args.suite}\n`);
    printUsageAndExit(2);
  }

  const selected = selectTests(args);
  if (selected.length === 0) {
    process.stderr.write("No tests matched the given filters.\n");
    process.exit(2);
  }

  printHeader({ suite: args.suite, grep: args.grep, total: selected.length });

  const results = [];
  let failedCount = 0;

  for (const test of selected) {
    process.stdout.write(`- [${test.suite}] ${test.name} ... `);
    const startedAt = Date.now();
    let status = "passed";
    let details = "";
    try {
      await test.fn();
      process.stdout.write(`PASS (${fmtDuration(Date.now() - startedAt)})\n`);
    } catch (error) {
      status = "failed";
      details = error instanceof Error ? error.stack ?? error.message : String(error);
      failedCount++;
      process.stdout.write(`FAIL (${fmtDuration(Date.now() - startedAt)})\n`);
      process.stderr.write(`  ${details.split("\n").join("\n  ")}\n`);
      if (args.bail) {
        results.push({ test, status, details });
        break;
      }
    }
    results.push({ test, status, details });
  }

  const passed = results.filter((r) => r.status === "passed").length;
  process.stdout.write(`\nResult: ${passed}/${results.length} passed, ${failedCount} failed\n`);

  process.exit(failedCount === 0 ? 0 : 1);
}

run().catch((err) => {
  process.stderr.write(`Fatal test runner error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
