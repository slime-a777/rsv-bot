const http = require('http');
const querystring = require('querystring');
const discord = require('discord.js');
const client = new discord.Client();
const fs = require('fs');
var BOSS = ["ゴブリングレート", "ライライ", "AA", "BB", "CC"];

http.createServer(function(req, res){
  if (req.method == 'POST'){
    var data = "";
    req.on('data', function(chunk){
      data += chunk;
    });
    req.on('end', function(){
      if(!data){
        res.end("No post data");
        return;
      }
      var dataObject = querystring.parse(data);
      console.log("post:" + dataObject.type);
      if(dataObject.type == "wake"){
        console.log("Woke up in post");
        res.end();
        return;
      }
      res.end();
    });
  }
  else if (req.method == 'GET'){
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Discord Bot is active now\n');
  }
}).listen(3000);

client.on('ready', message =>{
  console.log('Bot準備完了～');
});

client.on('message', message =>{
  if (message.author.id == client.user.id || message.author.bot){
    return;
  }
  if(message.isMemberMentioned(client.user)){
    sendReply(message, "呼びましたか？");
    return;
  }
  const args = message.content.trim().split(/ +/g);
  const command = args[0];
  const lap = Number(args[1] - 1);
  const bossNumber = Number(args[2] - 1);
  const name = args[3];
  var rsvData = JSON.parse(fs.readFileSync('./rsvData.json', 'utf8'));
  if (command === "rsv") {
    if (!rsvData[lap]) rsvData[lap] = [];
    if (!rsvData[lap][bossNumber]) rsvData[lap][bossNumber] = [];
    rsvData[lap][bossNumber].push(name);
    fs.writeFileSync('./rsvData.json', JSON.stringify(rsvData, null, '    '),  (err)=>{
      if(err) console.log(`error!::${err}`);
    });
    sendList(rsvData, message);
    return;
  }
  if (command === "list") {
    sendList(rsvData, message);
  }
  if (command === "del") {
    if (isNaN(lap)) {
      rsvData.length = 0;
    } else if (isNaN(bossNumber)) {
      rsvData[lap] = [];
    } else if (name == null) {
      rsvData[lap][bossNumber].length = 0;
    } else {
      rsvData[lap][bossNumber] = rsvData[lap][bossNumber].filter(function(a) {
        return a != name;
      });
    }
    fs.writeFileSync('./rsvData.json', JSON.stringify(rsvData, null, '    '),  (err)=>{
      if(err) console.log(`error!::${err}`);
    });
    sendList(rsvData, message);
  }
});

if(process.env.DISCORD_BOT_TOKEN == undefined){
 console.log('DISCORD_BOT_TOKENが設定されていません。');
 process.exit(0);
}

client.login( process.env.DISCORD_BOT_TOKEN );

function sendReply(message, text){
  message.reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option={}){
  client.channels.get(channelId).send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

function sendList(rsvData, message) {
  var listText = "予約状況:\n";
  rsvData.forEach((lapData, lapIndex) => {
    if (lapData != null && lapData.length !== 0) {
      console.log(lapData);
      listText += (lapIndex + 1) + "周目\n";
      lapData.forEach((bossData, bossIndex) => {
        listText += BOSS[bossIndex] + ": ";
        for (var i in bossData) {
          listText += bossData[i] + " ";
        }
        listText += "\n";
      });
    } 
  });
  sendMsg(message.channel.id, listText);
}
