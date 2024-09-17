FROM node:20-alpine
RUN npm install
RUN npm run build
CMD ["npm", "start"]
#マルチステージビルドを使って、アプリケーションを動かすのに必要なファイルだけを最終的に出来上がるイメージに持ってくる
#Next.js のスタンドアロンモードを使って、アプリケーションの軽量化を行う