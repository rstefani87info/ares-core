# `@ares/core` Documentation

## Purpose

This folder contains the package-specific documentation for `@ares/core`.

The `core` package is the foundational runtime layer of the aReS framework: it creates the shared runtime instance, defines the module extension mechanism, and hosts cross-cutting utilities and services used by the other packages.

## Suggested Reading Order

1. Read `core.md` for a technical overview of the package and its actual API surface.
2. Read `api-surface.md` to understand which modules and subpaths should be treated as stable, transitional, or internal.

## Available Documents

- [Technical Overview](./core.md)
- [API Surface Classification](./api-surface.md)

## When To Use This Documentation

This documentation is useful when you need to:

- understand what `@ares/core` really exposes;
- distinguish between root API, stable subpaths, transitional modules, and internal helpers;
- separate direct utility imports from runtime extensions attached through `include()`;
- navigate the current structure of the package.

## Note

This folder documents the `core` package, not the whole aReS ecosystem. For package-specific modules such as `web`, `files`, `os`, or `datasource-mysql`, refer to their local documentation.
