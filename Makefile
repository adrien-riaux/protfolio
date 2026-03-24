SHELL := /bin/bash

.PHONY: help install dev build preview check test clean

help:
	@echo "Targets:"
	@echo "  make install  - Install dependencies with Bun"
	@echo "  make dev      - Run Astro dev server"
	@echo "  make build    - Build production site"
	@echo "  make preview  - Preview production build"
	@echo "  make check    - Run Astro type/content checks"
	@echo "  make test     - Run Bun tests"
	@echo "  make clean    - Remove build artifacts"

install:
	bun install

dev:
	bun run dev

build:
	bun run build

preview:
	bun run preview

check:
	bun run check

test:
	bun run test

clean:
	rm -rf dist .astro coverage
