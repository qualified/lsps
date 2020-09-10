// Derived from [autocompleter](https://github.com/kraaden/autocomplete).
// MIT License. Copyright (c) 2016 - Denys Krasnoshchok

export interface TypeaheadItem {
  label: string;
}

export interface TypeaheadOptions<T extends TypeaheadItem> {
  getSuggestions: (this: void, text: string) => Promise<T[]>;
  onSelect: (this: void, item: T) => void;
  onUpdate?: (this: void, current: T) => void;
  onCancel?: (this: void) => void;
  render?: (this: void, item: T, value: string) => HTMLDivElement | undefined;
  className?: string;
  debounceTimeout?: number;
}

export type Disposer = () => void;

// Attach suggestions to input element.
export const attachTypeahead = <T extends TypeaheadItem>(
  input: HTMLInputElement,
  {
    getSuggestions,
    onSelect,
    onUpdate,
    onCancel,
    render = defaultRender,
    className = "",
    debounceTimeout = 0,
  }: TypeaheadOptions<T>
): Disposer => {
  const doc = document;
  let items: T[] = [];
  let inputValue = "";
  let selected: T | undefined;
  let selectedIndex = -1;
  let suggestionCount = 0;
  let debounceTimer: number | undefined;

  const container: HTMLDivElement = doc.createElement("div");
  const containerStyle = container.style;
  container.className = className;
  containerStyle.position = "absolute";

  const attach = () => {
    if (!container.parentNode) doc.body.appendChild(container);
  };
  const detach = () => {
    const parent = container.parentNode;
    if (parent) parent.removeChild(container);
  };
  const containerDisplayed = () => !!container.parentNode;
  const clear = () => {
    // prevent suggestion update
    suggestionCount++;
    items = [];
    inputValue = "";
    selected = undefined;
    selectedIndex = -1;
    detach();
  };

  const clearDebounceTimer = () => {
    if (debounceTimer) window.clearTimeout(debounceTimer);
  };

  const updatePosition = () => {
    if (!containerDisplayed()) return;

    containerStyle.height = "auto";
    containerStyle.width = input.offsetWidth + "px";

    const calc = () => {
      const docEl = doc.documentElement;
      const clientTop = docEl.clientTop || doc.body.clientTop || 0;
      const clientLeft = docEl.clientLeft || doc.body.clientLeft || 0;
      const scrollTop = window.pageYOffset || docEl.scrollTop;
      const scrollLeft = window.pageXOffset || docEl.scrollLeft;
      const inputRect = input.getBoundingClientRect();
      const top = inputRect.top + input.offsetHeight + scrollTop - clientTop;
      const left = inputRect.left + scrollLeft - clientLeft;
      containerStyle.top = top + "px";
      containerStyle.left = left + "px";

      const maxHeight = Math.max(
        0,
        window.innerHeight - (inputRect.top + input.offsetHeight)
      );
      containerStyle.top = top + "px";
      containerStyle.bottom = "";
      containerStyle.left = left + "px";
      containerStyle.maxHeight = maxHeight + "px";
    };

    // > Must be called twice, otherwise the calculation may be wrong on resize event (chrome browser)
    calc();
    calc();
  };

  // Show suggestions
  const update = () => {
    container.textContent = "";
    if (items.length === 0) {
      clear();
      return;
    }

    const fragment = doc.createDocumentFragment();
    for (const item of items) {
      const div = render(item, inputValue);
      if (!div) return;

      div.addEventListener("click", (ev: MouseEvent) => {
        onSelect(item);
        clear();
        ev.preventDefault();
        ev.stopPropagation();
      });
      if (item === selected) div.className += " selected";
      fragment.appendChild(div);
    }
    container.appendChild(fragment);
    attach();
    updatePosition();
    updateScroll();
  };

  const updateIfDisplayed = () => {
    if (containerDisplayed()) update();
  };

  const onResize = () => {
    updateIfDisplayed();
  };

  const onScroll = (e: Event) => {
    if (e.target !== container) {
      updateIfDisplayed();
    } else {
      e.preventDefault();
    }
  };

  const onInput = (ev: Event) => {
    triggerGetSuggestion();
  };

  // Scroll if selected item is not visible
  const updateScroll = () => {
    const selectedEl = container.getElementsByClassName("selected");
    if (selectedEl.length === 0) return;

    const el = selectedEl[0] as HTMLDivElement;
    if (el.offsetTop < container.scrollTop) {
      container.scrollTop = el.offsetTop;
    } else {
      const selectedBottom = el.offsetTop + el.offsetHeight;
      const containerBottom = container.scrollTop + container.offsetHeight;
      if (selectedBottom > containerBottom) {
        container.scrollTop += selectedBottom - containerBottom;
      }
    }
  };

  const handleArrow = (newIndex: number) => {
    const n = items.length;
    if (n === 0) {
      selected = undefined;
      selectedIndex = -1;
    } else {
      selectedIndex = ((newIndex % n) + n) % n;
      selected = items[selectedIndex];
      if (selected && onUpdate) onUpdate(selected);
      update();
    }
  };

  const onKeydown = (ev: KeyboardEvent) => {
    const key = ev.key;
    switch (key) {
      case "Esc":
      case "Escape":
        clear();
        ev.preventDefault();
        ev.stopPropagation();
        if (onCancel) onCancel();
        return;

      case "Up":
      case "Down":
      case "ArrowUp":
      case "ArrowDown": {
        const delta = key === "ArrowUp" || key === "Up" ? -1 : +1;
        ev.preventDefault();
        handleArrow(selectedIndex + delta);
        return;
      }

      case "Enter":
        if (selected) {
          onSelect(selected);
          clear();
        }
        ev.preventDefault();
        return;
    }
  };

  const onInputFocus = () => {
    triggerGetSuggestion(false);
  };

  const triggerGetSuggestion = (debounce: boolean = true) => {
    const count = ++suggestionCount;
    const val = input.value;
    clearDebounceTimer();
    debounceTimer = window.setTimeout(
      () => {
        getSuggestions(val).then((xs) => {
          if (suggestionCount !== count) return;

          items = xs;
          inputValue = val;
          if (items.length === 0) {
            selectedIndex = -1;
            selected = undefined;
          } else {
            selectedIndex = 0;
            selected = items[0];
            if (selected && onUpdate) onUpdate(selected);
          }
          update();
        });
      },
      debounce ? debounceTimeout : 0
    );
  };

  const onInputBlur = () => {
    // Delayed so that clicked item is not cleared (input.blur happens before item.click)
    setTimeout(() => {
      if (doc.activeElement !== input) clear();
    }, 200);
  };

  // Prevent long clicks from losing focus
  container.addEventListener("mousedown", (evt: Event) => {
    evt.stopPropagation();
    evt.preventDefault();
  });
  // Prevent closing when scrollbar is clicked in IE
  container.addEventListener("focus", () => input.focus());

  // Set up event handlers
  input.addEventListener("keydown", onKeydown);
  input.addEventListener("input", onInput);
  input.addEventListener("blur", onInputBlur);
  input.addEventListener("focus", onInputFocus);
  window.addEventListener("resize", onResize);
  doc.addEventListener("scroll", onScroll, true);

  return () => {
    input.removeEventListener("focus", onInputFocus);
    input.removeEventListener("keydown", onKeydown);
    input.removeEventListener("input", onInput);
    input.removeEventListener("blur", onInputBlur);
    window.removeEventListener("resize", onResize);
    doc.removeEventListener("scroll", onScroll, true);
    clearDebounceTimer();
    clear();
  };
};

const defaultRender = <T extends TypeaheadItem>(
  item: T,
  value: string
): HTMLDivElement | undefined => {
  const div = document.createElement("div");
  div.textContent = item.label;
  return div;
};
