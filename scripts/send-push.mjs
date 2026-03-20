#!/usr/bin/env node
/**
 * Send push notification to a subscription.
 *
 * Usage:
 *   node scripts/send-push.mjs <subscription.json> "Title" "Body" [url]
 *   node scripts/send-push.mjs --file subs.json "Title" "Body" [url]
 *
 * The subscription JSON is the output of pushSubscription.toJSON()
 * (stored in localStorage under ethcc-push-subscription).
 */
import webpush from "web-push";
import { readFileSync } from "fs";

const VAPID_PUBLIC_KEY =
  "BPGIM7JwUADTHBw3uY_3uE6Mg3O9p3hcvgKDr-cKSRhHnSvS18QNMu7RloqoIqzPmofRwl0mc4EXv3I4F4lyitw";
const VAPID_PRIVATE_KEY = "lHfKzTm5JgvpwCU5O7UWhMzpou5EppBBlDvbgGwcoNk";

webpush.setVapidDetails("mailto:sofia@ethcc.io", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log("Usage: node send-push.mjs <subscription.json|--file path> <title> <body> [url]");
  process.exit(1);
}

let subscription;
let titleIdx = 1;

if (args[0] === "--file") {
  subscription = JSON.parse(readFileSync(args[1], "utf8"));
  titleIdx = 2;
} else {
  subscription = JSON.parse(args[0]);
}

const title = args[titleIdx];
const body = args[titleIdx + 1];
const url = args[titleIdx + 2] || "/Treepl/home";

const payload = JSON.stringify({ title, body, url, tag: "sofia-manual" });

try {
  const result = await webpush.sendNotification(subscription, payload);
  console.log("Push sent:", result.statusCode);
} catch (err) {
  console.error("Push failed:", err.message);
  process.exit(1);
}
