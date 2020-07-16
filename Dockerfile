FROM node:10
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
ENV PORT=80
EXPOSE ${PORT}
ENV GOOGLE_APPLICATION_CREDENTIALS='./kole-sred-495401b5f9bc.json'
CMD ["npm", "start"]