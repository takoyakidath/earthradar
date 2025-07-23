
FROM node:20-slim       

# 以下は変えずにそのままでOK
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
