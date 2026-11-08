import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const directory = resolve(root, "package");
const manifest = JSON.parse(
  readFileSync(join(directory, "package.json"), "utf8"),
);
assert.equal(manifest.name, "@oxy.so/maplibre-react-native");
assert.equal(
  manifest.private,
  true,
  "Initial publication must be enabled in a reviewed release change",
);
assert.equal(manifest.codegenConfig.name, "MapLibreReactNativeSpec");
assert.equal(
  manifest.codegenConfig.android.javaPackageName,
  "org.maplibre.reactnative",
);
const destination = mkdtempSync(join(tmpdir(), "maplibre-package-"));
try {
  const [packed] = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--json", "--ignore-scripts", "--pack-destination", destination],
      { cwd: directory, encoding: "utf8" },
    ),
  );
  const paths = new Set(packed.files.map((file) => file.path));
  const targets = [];
  const visit = (value) => {
    if (typeof value === "string") targets.push(value.replace(/^\.\//, ""));
    else if (value && typeof value === "object")
      Object.values(value).forEach(visit);
  };
  visit(manifest.exports);
  for (const field of ["main", "module", "types", "source"])
    visit(manifest[field]);
  for (const target of targets)
    assert(paths.has(target), `Packed entry is missing: ${target}`);
  for (const target of [
    "LICENSE.md",
    "README.md",
    "MapLibreReactNative.podspec",
    "android/build.gradle",
  ]) {
    assert(paths.has(target), `Native/package input is missing: ${target}`);
  }
  assert(
    [...paths].some((path) => path.endsWith("MapViewNativeComponent.ts")),
    "Fabric component input is missing",
  );
  assert(
    [...paths].some((path) => path.endsWith("MLRNStyleValue.kt")),
    "Android bridge source is missing",
  );
  assert(
    ![...paths].some(
      (path) =>
        path.endsWith(".tsbuildinfo") || path.startsWith("android/build/"),
    ),
  );
  const license = execFileSync(
    "tar",
    ["-xOf", join(destination, packed.filename), "package/LICENSE.md"],
    { encoding: "utf8" },
  );
  assert.equal(license, readFileSync(join(root, "LICENSE.md"), "utf8"));
  console.log(
    `Verified ${new Set(targets).size} packed entry points, native inputs and unchanged MIT license (${packed.integrity}).`,
  );
} finally {
  rmSync(destination, { recursive: true, force: true });
}
