#!/usr/bin/env node
/*
 * Convert snarkjs verification_key.json into the compact binary format consumed
 * by pvm-verifier/src/ffi.rs::decode_vk.
 */

const fs = require("fs");
const path = require("path");

function usage() {
  console.error("Usage: node scripts/export-vk-bin.js <verification_key.json> <output.bin>");
}

function toBigInt(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") {
    if (value.startsWith("0x") || value.startsWith("0X")) return BigInt(value);
    return BigInt(value);
  }
  throw new Error(`Unsupported numeric value: ${value}`);
}

function toWord(value) {
  const n = toBigInt(value);
  if (n < 0n) throw new Error("Negative values are not supported");
  let hex = n.toString(16);
  if (hex.length > 64) throw new Error(`Value does not fit into 32 bytes: ${value}`);
  hex = hex.padStart(64, "0");
  return Buffer.from(hex, "hex");
}

function parseG1(point) {
  if (!Array.isArray(point) || point.length < 2) {
    throw new Error("Invalid G1 point in verification key");
  }
  return [point[0], point[1]];
}

function parseG2(point) {
  if (!Array.isArray(point) || point.length < 2) {
    throw new Error("Invalid G2 point in verification key");
  }

  const x = point[0];
  const y = point[1];

  if (!Array.isArray(x) || x.length < 2 || !Array.isArray(y) || y.length < 2) {
    throw new Error("Invalid G2 coordinates in verification key");
  }

  return [x[0], x[1], y[0], y[1]];
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    usage();
    process.exit(1);
  }

  const inputAbs = path.resolve(inputPath);
  const outputAbs = path.resolve(outputPath);

  const vk = JSON.parse(fs.readFileSync(inputAbs, "utf8"));

  if (!Array.isArray(vk.IC)) {
    throw new Error("Invalid verification key: missing IC array");
  }

  const chunks = [];

  chunks.push(toWord(vk.IC.length));

  const alpha1 = parseG1(vk.vk_alpha_1);
  chunks.push(toWord(alpha1[0]), toWord(alpha1[1]));

  const beta2 = parseG2(vk.vk_beta_2);
  chunks.push(toWord(beta2[0]), toWord(beta2[1]), toWord(beta2[2]), toWord(beta2[3]));

  const gamma2 = parseG2(vk.vk_gamma_2);
  chunks.push(toWord(gamma2[0]), toWord(gamma2[1]), toWord(gamma2[2]), toWord(gamma2[3]));

  const delta2 = parseG2(vk.vk_delta_2);
  chunks.push(toWord(delta2[0]), toWord(delta2[1]), toWord(delta2[2]), toWord(delta2[3]));

  for (const point of vk.IC) {
    const g1 = parseG1(point);
    chunks.push(toWord(g1[0]), toWord(g1[1]));
  }

  fs.mkdirSync(path.dirname(outputAbs), { recursive: true });
  fs.writeFileSync(outputAbs, Buffer.concat(chunks));

  console.log(`Wrote VK binary to ${outputAbs}`);
}

main();
