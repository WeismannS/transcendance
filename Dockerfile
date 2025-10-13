FROM oven/bun:alpine

WORKDIR /app

COPY . /app

RUN bun install && bun run build \
 && rm -rf node_modules src \
 && bun pm cache rm

EXPOSE 4000

CMD sh -c '\
if [ -f "/run/secrets/ssl_cert" ] && [ -f "/run/secrets/ssl_key" ]; then \
    exec bun run start --ssl-cert /run/secrets/ssl_cert --ssl-key /run/secrets/ssl_key ; \
else \
    exec bun run start; \
fi'