FROM node:lts-alpine as build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build

FROM node:lts-alpine as runtime
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/dist /app/dist
RUN adduser -D gmailer && chown -R gmailer /app
USER gmailer
CMD ["node", "dist/"]