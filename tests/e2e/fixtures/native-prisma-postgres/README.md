# native-prisma-postgres

A native TDK backend with `featuresEnabled: ["prisma"]` and `dependsOn: ["postgres"]`, used by
`scripts/e2e/prisma-postgres.sh`. On start it runs `prisma migrate deploy`, then serves `POST /orders`
and `GET /orders` through Prisma Client against TDK's Postgres.

It uses Prisma 7: the `prisma.config.ts` that the `prisma` feature generates puts the datasource URL in
`datasource.url`, which Prisma 6's CLI rejects ("Failed to parse syntax of config file"). Prisma 7 also
needs the `prisma-client` generator and a driver adapter (`@prisma/adapter-pg`).
