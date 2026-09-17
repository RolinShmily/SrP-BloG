# srp-blog-upv — zero-dependency Node image.
#
# There is no `npm install` step on purpose: the service uses only Node
# built-ins (`node:http`, `node:sqlite`, Web Crypto) plus TypeScript type
# stripping, which Node >= 22.5 understands natively.
#
# Build:  docker build -t srp-blog-upv ./services/upv
# Run:    docker run -d --name srp-blog-upv -p 8787:8787 \
#           -e SALT=... -v upv-data:/data srp-blog-upv

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=8787 \
	DB_PATH=/data/upv.sqlite \
	ALLOWED_ORIGINS=*

COPY package.json ./
COPY schema.sql ./
COPY src ./src

# SQLite lives on a volume so the counters survive image upgrades.
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# `--experimental-sqlite` is required on Node 22.5–22.12 and accepted (no-op)
# on newer releases; `--experimental-strip-types` runs the TypeScript sources
# directly, so no build step and no dist/ directory are needed.
CMD ["node", "--experimental-sqlite", "--experimental-strip-types", "src/server.ts"]
