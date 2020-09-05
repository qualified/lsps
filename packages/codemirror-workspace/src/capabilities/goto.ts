import type { Editor } from "codemirror";
import { Location, LocationLink } from "vscode-languageserver-protocol";

import { cmPosition, cmRange } from "../utils/conversions";
import { highlightRange } from "../utils/editor";

// Go to the location if it's in the same text document.
// Otherwise, let the app handle it.
// TODO Support Peek
export const gotoLocation = (
  cm: Editor,
  uri: string,
  location: Location | LocationLink[] | Location[]
) => {
  // TODO Let user pick if there are multiple locations
  const loc = Array.isArray(location) ? location[0] : location;
  if (Location.is(loc)) {
    if (loc.uri === uri) {
      const newPos = cmPosition(loc.range.start);
      highlightRange(cm, ...cmRange(loc.range), 1500);
      // @ts-ignore @types/codemirror doesn't allow `setCursor(pos, options)`
      cm.setCursor(newPos, { scroll: true });
      // TODO Figure out why the editor loses focus when triggered from context menu
      cm.focus();
    } else {
      // this.showTextDocument(loc.uri, loc.range);
      // console.log(loc);
    }
  } else if (LocationLink.is(loc)) {
    // Returned with client capability: textDocument.*.linkSupport
    if (loc.targetUri === uri) {
      const newPos = cmPosition(loc.targetSelectionRange.start);
      highlightRange(cm, ...cmRange(loc.targetRange), 1500);
      // @ts-ignore @types/codemirror doesn't allow `setCursor(pos, options)`
      cm.setCursor(newPos, { scroll: true });
      // TODO Figure out why the editor loses focus when triggered from context menu
      cm.focus();
    } else {
      // this.showTextDocument(loc.targetUri, loc.targetSelectionRange);
      // console.log(loc);
    }
  }
};
