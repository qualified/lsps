/**
 * @jest-environment node
 */
import fc from "fast-check";
import { groupBy, insertionSort, Compare } from "./array";

describe("insertionSort", () => {
  test("sorts the input according to the compare function in place", () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(10), { maxLength: 10 }),
        fc.compareFunc<number>(),
        (xs, cmp) => {
          insertionSort(xs, cmp);
          for (let i = 1; i < xs.length; ++i) {
            if (cmp(xs[i - 1], xs[i]) > 0) return false;
          }
          return true;
        }
      )
    );
  });
});

describe("groupBy", () => {
  test("order within a group is maintained", () => {
    type XY = { x: number; y: number };
    const cmp: Compare<XY> = (a, b) => a.x - b.x;
    expect(
      groupBy(
        [
          { x: 100, y: 80 },
          { x: 90, y: 90 },
          { x: 70, y: 95 },
          { x: 100, y: 100 },
          { x: 80, y: 110 },
          { x: 110, y: 115 },
          { x: 100, y: 120 },
          { x: 70, y: 125 },
          { x: 70, y: 130 },
          { x: 100, y: 135 },
          { x: 75, y: 140 },
          { x: 70, y: 140 },
        ] as XY[],
        cmp
      )
    ).toEqual([
      [
        { x: 70, y: 95 },
        { x: 70, y: 125 },
        { x: 70, y: 130 },
        { x: 70, y: 140 },
      ],
      [{ x: 75, y: 140 }],
      [{ x: 80, y: 110 }],
      [{ x: 90, y: 90 }],
      [
        { x: 100, y: 80 },
        { x: 100, y: 100 },
        { x: 100, y: 120 },
        { x: 100, y: 135 },
      ],
      [{ x: 110, y: 115 }],
    ] as XY[][]);
  });
});
