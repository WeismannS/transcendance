FROM oven/bun:alpine

WORKDIR /app

COPY . /app

RUN bun install \
 && bunx @tailwindcss/cli -i public/input.css -o public/output.css \
 && bun build --minify --entrypoints ./src/index.tsx --outfile public/index.js \
 && rm -rf node_modules src
 
EXPOSE 4000

CMD sh -c '\
if [ -f "/run/secrets/ssl_cert" ] && [ -f "/run/secrets/ssl_key" ]; then \
    exec bun x serve -s -l 4000 --ssl-cert /run/secrets/ssl_cert --ssl-key /run/secrets/ssl_key public; \
else \
    exec bun x serve -s -l 4000 public; \
fi'