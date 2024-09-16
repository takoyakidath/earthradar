#path通し
cd ../
pwd=$(pwd)
alias eqke='sh $pwd/manage.sh'
echo "export PATH=\$PATH:$pwd" >> ~/.bash_profile
source ~/.bash_profile
#nextjsなどのインストールをする
apt install nextjs
apt install ffmpeg
apt install Docker
#EarthQuakeの.envの編集を求める
#1.YoutubeのRTMP
echo "Please enter the RTMP URL:"
read rtmp
echo "rtmp=\"$rtmp\"" > ../scripts/.env
#scriptsの中のsystemctlファイルをcpする
#buildする
#start.shを実行する