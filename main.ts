// Bargain Beacon — a Black Friday deal finder, handed in as a program.
// The site is plain static files in app/ (ES modules, CSS, no build step),
// its 36 deals held in app/deals.js: each one was found and checked at its
// store on Black Friday 2026, with the check time and the source on its card.
// This program copies app/ and screenshots/ from beside this file into the
// output directory and writes /output/dossier.json with the vendored make.fun
// library, so the scorer can rebuild the same dossier byte for byte.
//
// It writes only inside the output directory: it never deletes that directory
// itself, it only clears what it is about to replace inside it. Deterministic:
// the same app/ and screenshots/ always produce the same dossier bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Create the output directory, then clear only its previous contents:
// the directory itself stays, so a second run writes the same bytes.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
  rmSync(join(out, name), { recursive: true, force: true });
}

cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 16 MiB of
// app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
