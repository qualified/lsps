# Contributing to LSPs

## Getting Started

You need the following tools installed:

- [Node v16.x+](https://nodejs.org/en/)
  - Recommended to use [fnm](https://github.com/Schniz/fnm) to manage Node versions
- [PNPM v6](https://pnpm.io/)

Build all packages in this repository:

```bash
pnpm install
```

Start a watcher to automatically compile TypeScript on change:

```bash
pnpm run watch:esm
# pnpm run watch:cjs if you want commonjs
```

Try some of the [examples](./examples/).
Examples will reload automatically when you make changes.

## Changesets

[Changesets](https://github.com/atlassian/changesets) are used to automate version bumping and releasing the packages.

If you contribute anything that results in a version bump, you ned to write a changeset describing the changes.

To write a changeset, run `pnpx changeset` and follow the instructions shown. A new changeset will be added to `.changesets/`.

When changesets are pushed to `main`, a PR will be created automatically to keep track of the next version bump. Merging the PR bumps the versions, and release the affected packages.

See [Adding a changeset](https://github.com/atlassian/changesets/blob/main/docs/adding-a-changeset.md) for more.

## Code Style

[Prettier](https://prettier.io/) is used to ensure consistent style.

`pre-commit` hook to format staged changes is installed automatically when you run `pnpm install`, so you don't need to do anything. However, it's recommended to [configure your editor](https://prettier.io/docs/en/editors.html) to format on save, and forget about formatting.

## Troubleshooting

### TypeScript is failing to build after changing types in workspace packages

Run `pnpm install` in project root.
