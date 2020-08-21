export const addTooltip = (el: HTMLElement, x: number, y: number) => {
  const tooltip = document.createElement("div");
  tooltip.classList.add("cm-lsp-tooltip");
  tooltip.style.fontSize = "12px";
  tooltip.style.padding = "2px";
  tooltip.style.position = "absolute";
  tooltip.style.zIndex = "10";
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.appendChild(el);
  document.body.appendChild(tooltip);

  // Make sure that the tooltip is above the text even when it's multiline.
  requestAnimationFrame(() => {
    tooltip.style.top = `${y - tooltip.offsetHeight}px`;
  });
  return tooltip;
};
