#path通し
cd ../
pwd=$(pwd)
alias eqke='sh $pwd/manage.sh'
echo "export PATH=\$PATH:$pwd" >> ~/.bash_profile
source ~/.bash_profile
#nextjsなどのインストールをする
apt install nextjs
apt install ffmpeg
#EarthQuakeの.envの編集を求める
#1.YoutubeのRTMP

#scriptsの中のsystemctlファイルをcpする
#buildする
#start.shを実行する