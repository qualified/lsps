export type Compare<T> = (a: T, b: T) => number;

// Used for grouping snippet tabstops.
export const groupBy = <T>(xs: readonly T[], compare: Compare<T>): T[][] => {
  if (xs.length === 0) return [];

  const sorted = insertionSort(xs.slice(), compare);
  const groups: T[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; ++i) {
    if (compare(sorted[i - 1], sorted[i]) !== 0) {
      groups.push([sorted[i]]);
    } else {
      groups[groups.length - 1].push(sorted[i]);
    }
  }
  return groups;
};

// For stable sorting.
// Insertion sort works well for small input, especially when nearly sorted.
export const insertionSort = <T>(xs: T[], compare: Compare<T>): T[] => {
  for (let i = 1; i < xs.length; ++i) {
    if (compare(xs[i - 1], xs[i]) > 0) {
      // Do chained swaps
      let j = i;
      const tmp = xs[j];
      do {
        xs[j] = xs[--j];
      } while (j > 0 && compare(xs[j - 1], tmp) > 0);
      xs[j] = tmp;
    }
  }
  return xs;
};
