export const addTooltip = (
  tooltipContent: HTMLElement,
  x: number,
  y: number
) => {
  const tooltip = document.createElement("div");
  tooltip.classList.add("cmw-tooltip");
  tooltip.style.cssText = [`left: ${x}px;`, `top: ${y}px;`].join(" ");
  tooltip.appendChild(tooltipContent);
  const close = document.createElement("div");
  close.classList.add("cmw-tooltip-close");
  close.addEventListener("click", () => {
    tooltip.remove();
  });
  tooltip.appendChild(close);
  document.body.appendChild(tooltip);

  // Make sure that the tooltip is above the text even when it's multiline.
  requestAnimationFrame(() => {
    tooltip.style.top = `${y - tooltip.offsetHeight}px`;
  });
  return tooltip;
};
