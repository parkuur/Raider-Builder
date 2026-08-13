export interface FitFontSizeOptions {
  min: number;
  max: number;
  step?: number;
}

/**
 * Finds the largest font size in [min, max] (stepping down by `step`) at
 * which `measureWidth(size)` fits within `availableWidth`. Falls back to
 * `min` if even the smallest size doesn't fit — callers are expected to
 * accept overflow at the floor rather than shrinking text away to nothing.
 */
export function computeFitFontSize(
  measureWidth: (fontSize: number) => number,
  availableWidth: number,
  { min, max, step = 0.5 }: FitFontSizeOptions,
): number {
  let size = max;
  while (size > min && measureWidth(size) > availableWidth) {
    size = Math.max(min, size - step);
  }
  return size;
}

let sharedCanvas: HTMLCanvasElement | undefined;

function measureTextWidth(text: string, font: string): number {
  sharedCanvas ??= document.createElement("canvas");
  const ctx = sharedCanvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export interface AutoFitTextParams {
  min?: number;
}

/**
 * Svelte action for a text input: shrinks its font size (down to `min`)
 * so its current value keeps fitting the input's width, and restores the
 * element's own CSS font size once the text fits again unshrunk.
 */
export function autoFitText(
  node: HTMLInputElement,
  params: AutoFitTextParams = {},
) {
  let min = params.min ?? 8;
  // Captured once: the CSS-declared size, before this action ever writes an
  // inline override. Re-reading computed style after shrinking would treat
  // the shrunk value as the new ceiling, and the fit-then-reset-to-natural
  // cycle would fight itself via the node's own ResizeObserver forever.
  const max = parseFloat(getComputedStyle(node).fontSize);

  function measure() {
    const style = getComputedStyle(node);
    const text = node.value || node.placeholder;
    const available =
      node.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      parseFloat(style.borderLeftWidth) -
      parseFloat(style.borderRightWidth);
    if (!text || available <= 0) {
      node.style.fontSize = "";
      return;
    }
    const size = computeFitFontSize(
      (fontSize) =>
        measureTextWidth(
          text,
          `${style.fontWeight} ${fontSize}px ${style.fontFamily}`,
        ),
      available,
      { min: Math.min(min, max), max },
    );
    node.style.fontSize = size < max ? `${size}px` : "";
  }

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(node);
  node.addEventListener("input", measure);
  measure();

  return {
    update(newParams: AutoFitTextParams = {}) {
      min = newParams.min ?? 8;
      measure();
    },
    destroy() {
      node.removeEventListener("input", measure);
      resizeObserver.disconnect();
    },
  };
}
