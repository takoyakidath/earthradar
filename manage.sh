#!/bin/bash

show_help() {
  echo "Usage: ${0} [-s] [-i] [-t] [-p] [-h]"
  echo ""
  echo "Options:"
  echo "  -s    Set up the environment"
  echo "  -i    Install the software"
  echo "  -t    Start the software"
  echo "  -p    Stop the software"
  echo "  -h    Show this help message"
}

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

while getopts "sitph" OPT
do
  case $OPT in
    s)
      echo "[-s] が指定されました: 環境を設定します"
      # 環境設定のコードをここに追加
      ./managers/settings.sh
      ;;
    i)
      echo "[-i] が指定されました: ソフトウェアをインストールします"
      ./managers/install.sh  # install.sh を実行
      ;;
    t)
      echo "[-t] が指定されました: ソフトウェアを開始します"
      # 開始のコードをここに追加
      ./managers/start.sh
      ;;
    p)
      echo "[-p] が指定されました: ソフトウェアを停止します"
      # 停止のコードをここに追加
      ./managers/stop.sh
      ;;
    h)
      show_help
      exit 0
      ;;
    *)
      show_help
      exit 1
      ;;
  esac
done
