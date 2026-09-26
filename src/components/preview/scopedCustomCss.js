// Sandboxes admin-authored `appearance.customCss` to the chatbot
// preview only. This was previously always inert (see
// SectionAppearance.jsx) because a plain document-wide <style> tag
// cannot be contained by DOM placement alone — CSS rules apply
// globally regardless of where the <style> element physically sits in
// the tree. Shadow DOM would truly isolate it, but would also cut the
// widget preview off from the Tailwind stylesheet it depends on to
// render at all. Instead we rewrite every selector so it can only
// ever match inside a unique, per-mount scope attribute.
//
// We parse the admin's CSS with the browser's own CSS engine (a
// detached CSSStyleSheet, never inserted into the document) so we
// inherit real CSS parsing instead of a hand-rolled regex parser, then
// rewrite each rule's selector list to be prefixed with the scope
// selector before serializing it back out as plain text.
//
// Dropped outright (never included in the output):
//   @import     - would fetch arbitrary external resources
//   @font-face  - would fetch arbitrary external font files
//   @namespace, @page - no legitimate use in a chat widget preview
//
// @keyframes are renamed to a scope-unique name before being emitted,
// because CSS keyframe names are global to the document — an admin
// naming one e.g. "fade-in-up" would otherwise silently override the
// admin panel's own Tailwind keyframe of the same name used elsewhere
// on the page. The rename is a best-effort text rewrite of
// animation/animation-name declarations within the SAME custom
// stylesheet; malformed/unusual shorthand may not be caught (see
// Phase 22 report for this known limitation).
//
// `:root`, `html`, and `body` selectors are dropped rather than
// scoped: prefixing them with a descendant combinator (e.g.
// `[data-x="1"] :root`) makes them permanently unmatchable per the
// CSS spec anyway, so dropping them early is just an explicit,
// belt-and-suspenders confirmation of that.

let counter = 0;
export function nextCssScopeId() {
  counter += 1;
  return `nf-css-${Date.now().toString(36)}-${counter}`;
}

export function isScopedCssSupported() {
  return typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype;
}

function splitTopLevel(text, delimiter) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((s) => s.trim()).filter(Boolean);
}

const DROPPED_SELECTOR_RE = /^(:root|html|body)(\s|$|[.#:[])/i;

function scopeSelectorList(selectorText, scopeSelector) {
  const selectors = splitTopLevel(selectorText, ",");
  const scoped = selectors.filter((sel) => !DROPPED_SELECTOR_RE.test(sel)).map((sel) => `${scopeSelector} ${sel}`);
  return scoped.join(", ");
}

function collectKeyframeNames(sheet) {
  const names = new Map();
  for (const rule of sheet.cssRules) {
    if (rule.type === CSSRule.KEYFRAMES_RULE) {
      names.set(rule.name, `${rule.name}--nf-preview`);
    }
  }
  return names;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteAnimationDeclarations(cssText, keyframeRenames) {
  if (keyframeRenames.size === 0) return cssText;
  let out = cssText;
  for (const [original, renamed] of keyframeRenames) {
    const re = new RegExp(`(^|[\\s,])${escapeRegExp(original)}([\\s,;]|$)`, "g");
    out = out.replace(re, `$1${renamed}$2`);
  }
  return out;
}

function rewriteRule(rule, scopeSelector, keyframeRenames) {
  switch (rule.type) {
    case CSSRule.STYLE_RULE: {
      const selector = scopeSelectorList(rule.selectorText, scopeSelector);
      if (!selector) return "";
      const body = rewriteAnimationDeclarations(rule.style.cssText, keyframeRenames);
      return `${selector}{${body}}`;
    }
    case CSSRule.MEDIA_RULE: {
      const inner = Array.from(rule.cssRules)
        .map((r) => rewriteRule(r, scopeSelector, keyframeRenames))
        .filter(Boolean)
        .join("\n");
      return inner ? `@media ${rule.conditionText}{${inner}}` : "";
    }
    case CSSRule.SUPPORTS_RULE: {
      const inner = Array.from(rule.cssRules)
        .map((r) => rewriteRule(r, scopeSelector, keyframeRenames))
        .filter(Boolean)
        .join("\n");
      return inner ? `@supports ${rule.conditionText}{${inner}}` : "";
    }
    case CSSRule.KEYFRAMES_RULE: {
      const scopedName = keyframeRenames.get(rule.name) || rule.name;
      const frames = Array.from(rule.cssRules)
        .map((kf) => `${kf.keyText}{${kf.style.cssText}}`)
        .join("");
      return `@keyframes ${scopedName}{${frames}}`;
    }
    default:
      // @import, @font-face, @page, @namespace, and anything unknown
      // are silently dropped rather than emitted.
      return "";
  }
}

/**
 * Parses and re-scopes admin-authored CSS so every rule can only ever
 * match elements under `scopeSelector` (e.g. `[data-nf-css-scope="abc"]`).
 * Returns "" on any parse failure or when the browser doesn't support
 * the constructed-stylesheet API this relies on — callers should treat
 * that as "unavailable," never fall back to rendering it unscoped.
 */
export function buildScopedCss(rawCss, scopeSelector) {
  const trimmed = (rawCss || "").trim();
  if (!trimmed || !scopeSelector) return "";
  if (!isScopedCssSupported()) return "";
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(trimmed);
    const keyframeRenames = collectKeyframeNames(sheet);
    return Array.from(sheet.cssRules)
      .map((rule) => rewriteRule(rule, scopeSelector, keyframeRenames))
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}
