// Whether a click landed on something that does something (a link, a button, a form control,
// a tab...) rather than the page background. The About card keeps its plain-English text through
// scrolling and background taps, and flips back to JSON only on a real action elsewhere.
export const ACTION_TARGETS =
  'a[href], button, input, select, textarea, summary, label, [role="button"], [role="tab"], [role="link"], [tabindex]:not([tabindex="-1"])'

export const isActionTarget = target => Boolean(target?.closest?.(ACTION_TARGETS))
