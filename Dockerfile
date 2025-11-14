# Use the official Playwright docker image with browsers pre-installed
FROM mcr.microsoft.com/playwright:latest

WORKDIR /app

# Copy only package.json (we will remove playwright from it)
COPY package.json ./

# Install ONLY express (no playwright npm install)
RUN npm install --production

# Copy our code
COPY index.js ./

EXPOSE 3000
CMD ["node", "index.js"]
