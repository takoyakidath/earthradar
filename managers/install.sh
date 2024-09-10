#path通し
pwd=$(pwd)
export PATH=$PATH:$pwd
alias eqke-start='sh $pwd/start.sh'
alias eqke-install='sh $pwd/install.sh'
alias eqke-setting='sh $pwd/setting.sh'
alias eqke-stop='sh $pwd/stop.sh'
alias eqke='sh $pwd/dev.sh'
source ~/.bashrc 

#nextjsなどのインストールをする
apt install nextjs
apt install ffmpeg
#EarthQuakeの.envの編集を求める
#1.YoutubeのRTMP

#scriptsの中のsystemctlファイルをcpする
#buildする
#start.shを実行する