FROM node:20-alpine

RUN apk add --no-cache wget

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["npm", "start"]