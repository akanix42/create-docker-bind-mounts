FROM node:8.11.1

ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN mkdir -p /home/node/app/
WORKDIR /home/node/app/
COPY dist/ /home/node/app/
RUN npm i --production

CMD [ "node" ]
