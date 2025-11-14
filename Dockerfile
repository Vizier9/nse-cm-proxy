FROM mcr.microsoft.com/playwright:focal

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --unsafe-perm

COPY index.js ./

EXPOSE 3000
CMD ["node", "index.js"]
