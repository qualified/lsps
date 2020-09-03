/**
 * @jest-environment jsdom
 */
import CodeMirror, { Pos, Position, Range } from "codemirror";
import { insertSnippet } from "./snippet";

describe("insertSnippet", () => {
  // CodeMirror.Range to simple plain object with two positions
  const rangeObj = (r: Range) => ({
    anchor: Pos(r.anchor.line, r.anchor.ch),
    head: Pos(r.head.line, r.head.ch),
  });
  const range = (anchor: Position, head: Position) => ({ anchor, head });

  test("placeholders", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const cm = CodeMirror(div, { value: "" });
    insertSnippet(
      cm,
      [
        "#[cfg(test)]",
        "mod tests {",
        "    use super::*;",
        "",
        "    #[test]",
        "    fn ${1:test_name}() {",
        "        $0",
        "    \\}",
        "\\}",
      ].join("\n"),
      Pos(0, 0),
      Pos(0, 0)
    );
    // inserted without tabstops/placeholders
    expect(cm.getValue()).toEqual(
      [
        `#[cfg(test)]`,
        `mod tests {`,
        `    use super::*;`,
        ``,
        `    #[test]`,
        `    fn test_name() {`,
        `        `,
        `    }`,
        `}`,
      ].join("\n")
    );
    // The first placeholder 'test_name' is selected
    expect(cm.listSelections().map(rangeObj)).toEqual([
      range(Pos(5, 7), Pos(5, 16)),
    ]);
    expect(cm.getSelections()).toEqual(["test_name"]);

    // @ts-ignore Undocumented method
    cm.triggerOnKeyDown({
      type: "keydown",
      keyCode: "\t".charCodeAt(0),
      preventDefault: () => {},
      stopPropagation: () => {},
    });
    // Jumps to the next tabstop. `$0` (the final tabstop) in this case.
    expect(cm.listSelections().map(rangeObj)).toEqual([
      range(Pos(6, 8), Pos(6, 8)),
    ]);
  });

  test("mirroring", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const cm = CodeMirror(div, { value: "" });
    insertSnippet(cm, 'eprintln!("$1 = {:?\\}", $1);$0', Pos(0, 0), Pos(0, 0));
    // inserted without tabstops/placeholders
    expect(cm.getValue()).toEqual('eprintln!(" = {:?}", );');
    // Both of `$1` tabstops are selected.
    expect(cm.listSelections().map(rangeObj)).toEqual([
      range(Pos(0, 11), Pos(0, 11)),
      range(Pos(0, 21), Pos(0, 21)),
    ]);
    // TODO Find a way to type characters
    // @ts-ignore Undocumented method
    // cm.triggerOnKeyDown({
    //   type: "keydown",
    //   keyCode: "a".charCodeAt(0),
    //   preventDefault: () => {},
    //   // stopPropagation: () => {},
    // });
    // expect(cm.getValue()).toEqual('eprintln!("a = {:?}", a);');
  });
});
