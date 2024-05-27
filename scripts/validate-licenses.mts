/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import checker from 'license-checker';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import spdxSatisfies from 'spdx-satisfies';
import { packages } from './packages.mjs';

/**
 * A general note on some black listed specific licenses:
 * - CC0
 *    This is not a valid license. It does not grant copyright of the code/asset, and does not
 *    resolve patents or other licensed work. The different claims also have no standing in court
 *    and do not provide protection to or from Google and/or third parties.
 *    We cannot use nor contribute to CC0 licenses.
 * - Public Domain
 *    Same as CC0, it is not a valid license.
 */
const allowedLicenses = [
  // Regular valid open source licenses supported by Google.
  'MIT',
  'ISC',
  'Apache-2.0',
  'Python-2.0',
  'Artistic-2.0',
  'BlueOak-1.0.0',

  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-4-Clause',

  // All CC-BY licenses have a full copyright grant and attribution section.
  'CC-BY-3.0',
  'CC-BY-4.0',

  // Have a full copyright grant. Validated by opensource team.
  'Unlicense',
  'CC0-1.0',
  '0BSD',
];

// Name variations of SPDX licenses that some packages have.
// Licenses not included in SPDX but accepted will be converted to MIT.
const licenseReplacements: { [key: string]: string } = {
  // Official SPDX identifier has a dash
  'Apache 2.0': 'Apache-2.0',
  // BSD is BSD-2-clause by default.
  'BSD': 'BSD-2-Clause',
};

// Specific packages to ignore, add a reason in a comment. Format: package-name@version.
const ignoredPackages = [
  // * Broken license fields
  'pako@1.0.11', // MIT but broken license in package.json
];

// Ignore own packages (all MIT)
for (const pkg of packages) {
  const version = pkg.experimental ? '0.0.0-EXPERIMENTAL-PLACEHOLDER' : '0.0.0-PLACEHOLDER';
  ignoredPackages.push(`${pkg.name}@${version}`);
}

// Find all folders directly under a `node_modules` that have a package.json.

// Check if a license is accepted by an array of accepted licenses
function _passesSpdx(licenses: string[], accepted: string[]) {
  try {
    return spdxSatisfies(licenses.join(' AND '), accepted.join(' OR '));
  } catch {
    return false;
  }
}

export default function (_options: {}): Promise<number> {
  return new Promise((resolve) => {
    checker.init(
      { start: path.join(fileURLToPath(import.meta.url), '../..'), excludePrivatePackages: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: Error, json: any) => {
        if (err) {
          console.error(`Something happened:\n${err.message}`);
          resolve(1);
        } else {
          console.info(`Testing ${Object.keys(json).length} packages.\n`);

          // Packages with bad licenses are those that neither pass SPDX nor are ignored.
          const badLicensePackages = Object.keys(json)
            .map((key) => ({
              id: key,
              licenses: ([] as string[])
                .concat(json[key].licenses as string[])
                // `*` is used when the license is guessed.
                .map((x) => x.replace(/\*$/, ''))
                .map((x) => (x in licenseReplacements ? licenseReplacements[x] : x)),
            }))
            .filter((pkg) => !_passesSpdx(pkg.licenses, allowedLicenses))
            .filter((pkg) => !ignoredPackages.find((ignored) => ignored === pkg.id));

          // Report packages with bad licenses
          if (badLicensePackages.length > 0) {
            console.error('Invalid package licences found:');
            badLicensePackages.forEach((pkg) => {
              console.error(`${pkg.id}: ${JSON.stringify(pkg.licenses)}`);
            });
            console.error(`\n${badLicensePackages.length} total packages with invalid licenses.`);
            resolve(2);
          } else {
            console.info('All package licenses are valid.');
            resolve(0);
          }
        }
      },
    );
  });
}
