# A minimal Actix Web 4 app (Actix has no project generator, so the app is the files next to this Dockerfile).
FROM rust:1-slim AS build
WORKDIR /app
COPY Cargo.toml ./
# Build the dependencies first so source edits do not recompile them.
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY src ./src
RUN touch src/main.rs && cargo build --release

FROM debian:stable-slim
COPY --from=build /app/target/release/actix-app /usr/local/bin/actix-app
CMD ["actix-app"]
