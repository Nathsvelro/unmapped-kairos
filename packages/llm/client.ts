import "server-only";

/**
 * Compatibility shim. New code should import from `./provider` directly.
 * This file used to be the Anthropic-only client; everything has moved to
 * the provider abstraction so the same call paths now route to OpenAI or
 * Anthropic depending on env. Re-exports `isAvailable` and `detectProvider`
 * for any caller still importing from here.
 */
export { detectProvider, isAvailable, type ProviderId } from "./provider";
