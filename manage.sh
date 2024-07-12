#!/bin/bash

show_help() {
  echo "Usage: ${0} [-s] [-i] [-r] [-h]"
  echo ""
  echo "Options:"
  echo "  -s    Set up the environment"
  echo "  -i    Install the software"
  echo "  -r    Remove the software"
  echo "  -h    Show this help message"
}

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

while getopts "sirh" OPT
do
  case $OPT in
    s)
      echo "[-s] が指定された: 環境を設定します"
      # 環境設定のコードをここに追加
      ;;
    i)
      echo "[-i] が指定された: ソフトウェアをインストールします"
      ./install.sh  # install.sh を実行
      ;;
    r)
      echo "[-r] が指定された: ソフトウェアを削除します"
      # 削除のコードをここに追加
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
