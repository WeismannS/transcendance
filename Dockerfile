FROM oven/bun:latest


WORKDIR /app

COPY public /app/public

COPY src /app/src

COPY package.json /app/


COPY Miku /app/Miku

COPY server.ts /app/

COPY tsconfig.json /app/

RUN bun install 
RUN  bunx tsc  || true
RUN bunx @tailwindcss/cli -i public/input.css -o public/output.css 





EXPOSE 4000


CMD ["bun", "server.ts"]
