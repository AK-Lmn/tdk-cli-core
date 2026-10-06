# NestJS BYO Example: Native Project Proposal

Status: proposal for #512. This PR changes documentation only; implementation starts after maintainers agree on this scope.

## Scope

Refactor examples/byo/nestjs into a conventional NestJS 10 application while preserving the existing bring-your-own container contract. Keep this as a small HTTP example; do not add a database variant.

## Proposed choices

- Use the Nest CLI project layout: src/main.ts, src/app.module.ts, src/app.controller.ts, src/app.service.ts, nest-cli.json, and tsconfig.build.json.
- Use @nestjs/config to read PORT, retaining the current default of 3000. Listen on 0.0.0.0.
- Use @nestjs/terminus for the existing /health endpoint, with no database or external-service indicators.
- Keep the sample /orders response, moved into the app controller/service structure.
- Build with the local Nest CLI (nest build) in the Docker build stage; run the compiled dist/main.js in the runtime stage.
- Enable Nest shutdown hooks so Docker termination follows the framework lifecycle.
- Do not add Postgres, Prisma, migrations, a second sample variant, or cluster-deployment configuration. The example remains a BYO resource, not a TDK-generated application.

## Acceptance criteria for the implementation

1. scripts/verify-byo-example.sh nestjs builds the container and gets HTTP 200 from /health.
2. scripts/verify-byo-tdk.sh nestjs /health gets HTTP 200 through tdk up at the NestJS resource route, with the path prefix stripped as documented.
3. The app still reads the assigned PORT, binds 0.0.0.0, preserves /orders, and shuts down through Nest's lifecycle hooks.
4. The Docker build uses Nest CLI output and the runtime image starts the compiled entry point.
5. The per-folder README keeps its existing format and documents the commands actually run. Verification scripts remove their containers, networks, and image tags.

A separate Nest testing-module setup is intentionally not required in this first pass: the existing verification scripts exercise both the standalone container contract and TDK routing. If maintainers want a framework-level test, add it after the implementation scope is agreed.

## Review requested

Please confirm or adjust the proposed use of @nestjs/config and @nestjs/terminus, and the decision to keep the example database-free. No example code should change until this proposal is accepted.
