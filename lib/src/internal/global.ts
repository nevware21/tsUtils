/*
 * @nevware21/ts-utils
 * https://github.com/nevware21/ts-utils
 *
 * Copyright (c) 2022 Nevware21
 * Licensed under the MIT license.
 */

import { UNDEFINED } from "./constants";

const GLOBAL_CONFIG_KEY = "__tsUtils$gblCfg";

declare let globalThis: Window;
declare let global: Window;
declare let self: any;

/**
 * @internal
 * @ignore
 * Internal interface for holding the global polyfill symbols
 */
export interface _GlobalPolySymbols {
    k: { [key: string ]: symbol },
    s: { [sym: symbol ]: string },
}

/**
 * @internal
 * @ignore
 * Internal interface for defining global test hooks
 */
export interface _GlobalTestHooks {
    lzy?: boolean;
}

export interface TsUtilsGlobalConfig extends _GlobalTestHooks {
    gblSym?: _GlobalPolySymbols,
}

let _globalCfg: { [key: string ]: any };

/**
 * @internal
 * @ignore
 * Helper to get the current global value
 * @returns
 */
export function _getGlobalValue(): Window {
    let result: Window;
    if (typeof globalThis !== UNDEFINED) {
        result = globalThis;
    }

    if (!result && typeof self !== UNDEFINED) {
        result = self;
    }

    if (!result && typeof window !== UNDEFINED) {
        result = window;
    }

    if (!result && typeof global !== UNDEFINED) {
        result = global;
    }

    return result;
}

/**
 * @internal
 * @ignore
 * Gets/Sets the named value from the global config store, this is used to share configuration across
 * multiple modules. Primarily used for poly symbol and test hooks.
 * @returns The globally registered value.
 */
export function _getGlobalConfig(): TsUtilsGlobalConfig {
    if (!_globalCfg) {
        let gbl = _getGlobalValue() || {};
        _globalCfg = gbl[GLOBAL_CONFIG_KEY] = gbl[GLOBAL_CONFIG_KEY] || {};
    }

    return _globalCfg;
}
