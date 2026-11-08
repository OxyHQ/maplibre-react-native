# Android hillshade bridge correction

Based on upstream v11.5.1, commit
6941f96d1c7bc0e52847663d46935dc43e3ce2ab. MapLibre remains the author;
the MIT license and attribution are unchanged.

Android core 13.6.1 accepts arrays for illumination direction, altitude, shadow
color and highlight color, while the public React Native style accepts scalars.
The generator now wraps scalar numbers and converts processed ARGB colors to
core RGBA strings, including alpha. Arrays and expression dispatch retain their
existing paths. iOS source and core 6.31.0 are unchanged; physical iOS validation
has not been performed.

## Reproduce

Use Node 24 and pinned Yarn 4, from this repository root:

```sh
corepack yarn install --immutable
corepack yarn codegen
corepack yarn package lint
corepack yarn package test --runInBand
corepack yarn package build
corepack yarn package postbuild
```

Yarn does not automatically invoke arbitrary post hooks, so CI explicitly runs
postbuild. The checker packs with scripts disabled, verifies 11 entry points,
native inputs and identical MIT license. Android instrumentation covers numeric
scalars and color scalars including alpha. Pixel evidence in the GoWay audit
concerns the earlier private package artifact, not this newly named artifact.

## Private delivery candidate

Candidate: @oxy.so/maplibre-react-native@11.5.1-oxy.0. Keep consumer imports through
an npm alias under @maplibre/maplibre-react-native. Native module/codegen/pod names
remain unchanged. Packed alias, autolinking, codegen and native consumer build
must be validated before adoption. This is not a published package.

The package remains private. The upstream semantic-release job cannot publish
from this fork. No Oxy publication workflow is enabled yet. Before publication,
configure the canonical Oxy shared release workflow and npm trusted publisher
(OxyHQ, this repository, release-packages.yml, environment npm). If npm requires
the package to exist first, its owner performs the documented initial publish
and immediately configures trust. Keep private until that setup is ready. Future
releases must use the shared workflow. Package identity/version need review
before publication is enabled.

## Exact local alias probe

Pack with `npm pack --ignore-scripts` from `package/`, then run:

```sh
node scripts/verify-alias.mjs <tarball> <consumer-root-with-node_modules> <new-output-directory>
```

The consumer toolchain must contain Expo autolinking and React Native codegen.
The script installs the tarball under the existing dependency key, checks native
identity, generates the Android schema/native source, and writes hashes and
outputs. It never edits the supplied consumer. This is a local file alias check;
registry npm-alias installation remains pending until publication.

The podspec now names the fork and the shared release workflow's future
`<package-name>@<version>` tag. That tag does not exist while this package is
private. CocoaPods/Ruby execution is not verified on this Linux host.
