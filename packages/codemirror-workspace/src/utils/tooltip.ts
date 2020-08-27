export const addTooltip = (
  tooltipContent: HTMLElement,
  x: number,
  y: number
) => {
  const tooltip = document.createElement("div");
  tooltip.classList.add("cm-lsp-tooltip");
  tooltip.style.cssText = [
    "font-size: 12px;",
    "padding: 2px;",
    "z-index: 10;",
    "position: absolute;",
    `left: ${x}px;`,
    `top: ${y}px;`,
    `max-width: 50ch;`,
  ].join(" ");
  tooltip.appendChild(tooltipContent);
  document.body.appendChild(tooltip);

  // Make sure that the tooltip is above the text even when it's multiline.
  requestAnimationFrame(() => {
    tooltip.style.top = `${y - tooltip.offsetHeight}px`;
  });
  return tooltip;
};
