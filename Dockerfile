FROM mcr.microsoft.com/playwright:v1.56.1-focal

WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --unsafe-perm

# Copy application code
COPY index.js ./

EXPOSE 3000

CMD ["node", "index.js"]
