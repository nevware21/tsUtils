/*
 * @nevware21/ts-utils
 * https://github.com/nevware21/ts-utils
 *
 * Copyright (c) 2022 Nevware21
 * Licensed under the MIT license.
 */

import { UNDEF_VALUE } from "../internal/constants";
import { _getGlobalValue } from "../internal/global";
import { safeGetLazy } from "./safe_lazy";
import { ILazyValue, _globalLazyTestHooks } from "./lazy";

const WINDOW = "window";

declare let WorkerGlobalScope: any;
declare let self: any;

let _cachedGlobal: ILazyValue<Window>;

let _cachedWindow: ILazyValue<Window>;
let _cachedDocument: ILazyValue<Document>;
let _cachedNavigator: ILazyValue<Navigator>;
let _cachedHistory: ILazyValue<History>;
let _isWebWorker: ILazyValue<boolean>;
let _isNode: ILazyValue<boolean>;

/**
 * Create and return an readonly {@link ILazyValue} instance which will cache and return the named global
 * value if available, will return `null` if the named global object is not available or if the runtime
 * throws an exception when attempting to access the global object.
 * Unlike {@link getInst} the value is cached after the first access, so if the global value changes after
 * the initial fetch the original cached value is still returned.
 * @since 0.9.5
 * @group Environment
 * @group Lazy
 * @group Safe
 * @param name The name of the global object to get.
 * @returns A new readonly {@link ILazyValue} instance which will lazily attempt to return the globally
 * available named instance.
 * @example
 * ```ts
 * // This does not cause the evaluation to occur
 * window.myGlobal = "Hello";
 * let cachedValue = lazySafeGetInst("myGlobal");
 * // cachedValue.v === "Hello"
 *
 * window.myGlobal = "Darkness";
 * // cachedValue.v === "Hello"
 *
 * let promiseCls = lazySafeGetInst("Promise");
 * // null if Promise is not supported in the runtime
 * // otherwise the Promise class.
 * ```
 */
export function lazySafeGetInst<T>(name: string) : ILazyValue<T> {
    return safeGetLazy(() => getInst<T>(name) || UNDEF_VALUE, UNDEF_VALUE);
}

/**
 * Returns the current global scope object, for a normal web page this will be the current
 * window, for a Web Worker this will be current worker global scope via "self". The internal
 * implementation returns the first available instance object in the following order
 * - globalThis (New standard)
 * - self (Will return the current window instance for supported browsers)
 * - window (fallback for older browser implementations)
 * - global (NodeJS standard)
 * - <null> (When all else fails)
 * While the return type is a Window for the normal case, not all environments will support all
 * of the properties or functions. And this caches the lookup of the global as in some environments
 * this can be an expensive operation.
 * @group Environment
 * @param useCached - [Optional] used for testing to bypass the cached lookup, when `true` this will
 * cause the cached global to be reset.
 */
export function getGlobal(useCached?: boolean): Window {
    (!_cachedGlobal || useCached === false || (_globalLazyTestHooks.lzy && !_cachedGlobal.b)) && (_cachedGlobal = safeGetLazy(_getGlobalValue, null));

    return _cachedGlobal.v;
}

/**
 * Return the named global object if available, will return null if the object is not available.
 * @group Environment
 * @param name The globally named object
 * @param useCached - [Optional] used for testing to bypass the cached lookup, when `true` this will
 * cause the cached global to be reset.
 * @example
 * ```ts
 * // This does not cause the evaluation to occur
 * window.myGlobal = "Hello";
 * let cachedValue = getInst("myGlobal");
 * // cachedValue === "Hello"
 *
 * window.myGlobal = "Darkness";
 * // getInst("myGlobal") === "Darkness"
 *
 * let promiseCls = getInst("Promise");
 * // May throw if the global is not supported by the runtime
 * // otherwise the Promise class.
 * ```
 */
export function getInst<T>(name: string, useCached?: boolean): T {
    const gbl = getGlobal(useCached);
    if (gbl && gbl[name]) {
        return gbl[name] as T;
    }

    // Test workaround, for environments where <global>.window (when global == window) doesn't return the base window
    if (name === WINDOW && _cachedWindow) {
        // tslint:disable-next-line: no-angle-bracket-type-assertion
        return <any>_cachedWindow.v as T;
    }

    return null;
}

/**
 * Identify whether the runtime contains a `document` object
 * @group Environment
 * @returns - True if a `document` exists
 */
export function hasDocument(): boolean {
    return !!getDocument();
}

/**
 * Return the global `document` instance.
 * @group Environment
 * @returns
 */
export function getDocument(): Document {
    (!_cachedDocument || (_globalLazyTestHooks.lzy && !_cachedDocument.b)) && (_cachedDocument = lazySafeGetInst("document"));

    return _cachedDocument.v;
}

/**
 * Identify whether the runtime contains a `window` object
 * @group Environment
 * @returns
 */
export function hasWindow(): boolean {
    return !!getWindow();
}

/**
 * Return the global `window` instance.
 * @group Environment
 * @returns
 */
export function getWindow(): Window {
    (!_cachedWindow || (_globalLazyTestHooks.lzy && !_cachedWindow.b)) && (_cachedWindow = lazySafeGetInst(WINDOW));

    return _cachedWindow.v;
}

/**
 * Identify whether the runtimne contains a `navigator` object
 * @group Environment
 * @returns
 */
export function hasNavigator(): boolean {
    return !!getNavigator();
}

/**
 * Returns the global `navigator` instance
 * @group Environment
 * @returns
 */
export function getNavigator(): Navigator {
    (!_cachedNavigator || (_globalLazyTestHooks.lzy && !_cachedNavigator.b)) && (_cachedNavigator = lazySafeGetInst("navigator"));

    return _cachedNavigator.v;
}

/**
 * Identifies whether the runtime contains a `history` object
 * @group Environment
 * @returns
 */
export function hasHistory(): boolean {
    return !!getHistory();
}

/**
 * Returns the global `history` instance
 * @group Environment
 * @returns
 */
export function getHistory(): History | null {
    (!_cachedHistory || (_globalLazyTestHooks.lzy && !_cachedHistory.b)) && (_cachedHistory = lazySafeGetInst("history"));

    return _cachedHistory.v;
}

/**
 * Simple method to determine if we are running in a node environment
 * @group Environment
 * @returns True if you are
 */
export function isNode(): boolean {
    !_isNode && (_isNode = safeGetLazy(() => !!(process && (process.versions||{}).node), false))

    return _isNode.v;
}

/**
 * Helper to identify if you are running as a Dedicated, Shared or Service worker
 * @group Environment
 * @returns True if the environment you are in looks like a Web Worker
 */
export function isWebWorker(): boolean {
    !_isWebWorker && (_isWebWorker = safeGetLazy(() => !!(self && self instanceof WorkerGlobalScope), false));

    return _isWebWorker.v;
}
