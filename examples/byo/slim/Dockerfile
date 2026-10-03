# A real Slim skeleton from `composer create-project` (PHP, no external database).
FROM composer:2 AS build
WORKDIR /work
RUN composer create-project slim/slim-skeleton app --no-interaction --prefer-dist

FROM php:8.4-cli
RUN apt-get update -qq && apt-get install -y -qq unzip git >/dev/null && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /work/app /app
# The skeleton's front controller is public/index.php. The built-in server must listen beyond loopback and on TDK's port.
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} -t public"]
