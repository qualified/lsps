import type { Editor } from "codemirror";
import { Location, LocationLink } from "vscode-languageserver-protocol";

import { cmPosition } from "../utils/conversions";

// Go to the location if it's in the same text document.
// Otherwise, let the app handle it.
// TODO Maybe provide a way to peek the file not in the workspace as well.
export const gotoLocation = (
  cm: Editor,
  uri: string,
  location: Location | LocationLink[] | Location[]
) => {
  // TODO Let user pick if there are multiple locations
  const loc = Array.isArray(location) ? location[0] : location;
  if (Location.is(loc)) {
    // TODO Briefly highlight the range
    if (loc.uri === uri) {
      const newPos = cmPosition(loc.range.start);
      cm.setCursor(newPos);
      cm.scrollIntoView(newPos);
    } else {
      // this.showTextDocument(loc.uri, loc.range);
      // console.log(loc);
    }
  } else if (LocationLink.is(loc)) {
    // Returned with client capability: textDocument.*.linkSupport
    // TODO Use `loc.targetRange` to briefly highlight the section
    if (loc.targetUri === uri) {
      const newPos = cmPosition(loc.targetSelectionRange.start);
      cm.setCursor(newPos);
      cm.scrollIntoView(newPos);
    } else {
      // this.showTextDocument(loc.targetUri, loc.targetSelectionRange);
      // console.log(loc);
    }
  }
};
