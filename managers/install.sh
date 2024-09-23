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
#1.YoutubeのRTMP
echo "Please enter the RTMP URL:"
read rtmp
echo "rtmp=\"$rtmp\"" > ../scripts/.env
#dockerをbuildする
#start.shを実行する
sh start.sh