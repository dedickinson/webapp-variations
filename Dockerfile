FROM docker.io/node:10.15.1-alpine

# Build: docker build -t wb-js-site .
# Run: docker run --rm -ti -p 3000:3000 wb-js-site

RUN apk update \
    && apk upgrade

RUN mkdir /opt/app \
    && chown node.node /opt/app

USER node
WORKDIR /opt/app

COPY src/ ./

RUN npm install --only=production --no-audit --no-optional --no-bin-links --ignore-scripts

EXPOSE 3000

CMD npm start