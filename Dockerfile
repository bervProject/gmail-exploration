FROM node:lts-alpine as build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn 
COPY . .
RUN yarn build

FROM node:lts-alpine as runtime
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
COPY --from=build /app/dist /app/dist
CMD ["node", "dist/"]