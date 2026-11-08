import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, join } from "node:path";

const [tarballArg, toolchainArg, outputArg] = process.argv.slice(2);
assert(
  tarballArg && toolchainArg && outputArg,
  "Usage: node scripts/verify-alias.mjs <tgz> <consumer-root-with-node_modules> <new-output-directory>",
);
const tarball = resolve(tarballArg);
const toolchain = resolve(toolchainArg);
const output = resolve(outputArg);
mkdirSync(output); // Exclusive: never replace previous evidence.
const manifest = {
  name: "maplibre-alias-check",
  version: "0.0.0",
  private: true,
  dependencies: { "@maplibre/maplibre-react-native": `file:${tarball}` },
};
writeFileSync(
  join(output, "package.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
const run = (command, args) =>
  execFileSync(command, args, {
    cwd: output,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
writeFileSync(
  join(output, "install.log"),
  run("npm", [
    "install",
    "--ignore-scripts",
    "--legacy-peer-deps",
    "--no-audit",
    "--no-fund",
  ]),
);
const require = createRequire(join(output, "package.json"));
const resolved =
  require.resolve("@maplibre/maplibre-react-native/package.json");
const installed = JSON.parse(readFileSync(resolved, "utf8"));
assert.equal(installed.name, "@oxy.so/maplibre-react-native");
assert.equal(installed.codegenConfig.name, "MapLibreReactNativeSpec");
const cli = join(
  toolchain,
  "node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js",
);
const autolink = JSON.parse(
  run(process.execPath, [
    cli,
    "react-native-config",
    "--platform",
    "android",
    "--project-root",
    output,
    "--json",
  ]),
);
writeFileSync(
  join(output, "autolinking.json"),
  JSON.stringify(autolink, null, 2) + "\n",
);
const android =
  autolink.dependencies["@maplibre/maplibre-react-native"].platforms.android;
assert.equal(android.packageInstance, "new MLRNPackage()");
assert.equal(android.libraryName, "MapLibreReactNativeSpec");
assert(android.componentDescriptors.includes("MLRNMapViewComponentDescriptor"));
const codegen = join(toolchain, "node_modules/@react-native/codegen/lib/cli");
run(process.execPath, [
  join(codegen, "combine/combine-js-to-schema-cli.js"),
  "--platform",
  "android",
  "--libraryName",
  android.libraryName,
  "schema.json",
  join(output, "node_modules/@maplibre/maplibre-react-native/src"),
]);
run(process.execPath, [
  join(codegen, "generators/generate-all.js"),
  "schema.json",
  android.libraryName,
  "generated",
  "org.maplibre.reactnative",
]);
const receipt = {
  tarball,
  sha256: createHash("sha256").update(readFileSync(tarball)).digest("hex"),
  resolved,
  name: installed.name,
  version: installed.version,
  node: process.version,
  reactNative: JSON.parse(
    readFileSync(
      join(toolchain, "node_modules/react-native/package.json"),
      "utf8",
    ),
  ).version,
  descriptors: android.componentDescriptors,
  scope:
    "Local tarball installed under consumer dependency key. Not a registry npm-alias or native compilation acceptance.",
};
writeFileSync(
  join(output, "receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
