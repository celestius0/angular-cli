/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { workerData } from 'node:worker_threads';

register('./loader-hooks.js', { parentURL: pathToFileURL(__filename), data: workerData });
