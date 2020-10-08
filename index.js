
const Discord = require('./js/node_modules/discord.js.js.js.js');
const client = new Discord.Client();
const config = require('./config.json');
const fs = require('fs');


client.login(config.token)
 
const queue = new Map();
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const youtube = new YouTube("AIzaSyCi603T2d5Ew0NjOOZDzl4YBF3oGmOHCxY"); //https://console.developers.google.com/projectselector/apis/api/youtube.googleapis.com/overview

var servers = {};

 client.on("message", async message => {
     var args = message.content.substring(config.prefix.length).split(" ");
     if (!message.content.startsWith(config.prefix)) return;
   var searchString = args.slice(1).join(' ');
     var url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
     var serverQueue = queue.get(message.guild.id);
     switch (args[0].toLowerCase()) {
       case "play" || "tocar":
     var voiceChannel = message.member.voiceChannel;
         if (!voiceChannel) return message.channel.send(new Discord.RichEmbed()
         .setColor("#bc9f9f")
         .setTitle( 'Me desculpe, você não está conectado a um canal de música!'))
         var permissions = voiceChannel.permissionsFor(message.client.user);
         if (!permissions.has('CONNECT')) {
             return message.channel.send(new Discord.RichEmbed()
             .setColor("#AE05BB")
             .setTitle(' Não consigo me conectar ao seu canal de voz, verifique se tenho as permissões adequadas!'))
         }
         if (!permissions.has('SPEAK')) {
             return message.channel.send(new Discord.RichEmbed()
             .setColor("#AE05BB")
             .setTitle(' Eu não posso falar neste canal de voz, verifique se eu tenho as permissões adequadas!'))
         }
       if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
             var playlist = await youtube.getPlaylist(url);
             var videos = await playlist.getVideos();
             for (const video of Object.values(videos)) {
                 var video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                 await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
             }
             return message.channel.send(new Discord.RichEmbed()
             .setColor("#AE05BB")
             .setDescription(`< | Playlist: \n\```fix\n• ${playlist.title}\``` foi adicionado a PlayList!\n• Author: ${message.author}`)).then(m => m.delete(9000))
         } else {
             try {
                 var video = await youtube.getVideo(url);
             } catch (error) {
                 try {
                     var videos = await youtube.searchVideos(searchString, 10);
                     var index = 0;
                     message.channel.send(new Discord.RichEmbed()
                .setTimestamp()
                .setColor("#AE05BB")
                .setDescription(` **Seleção de Música:**
 ${videos.map(video2 => `\`\`\n${++index}-\`\` ${video2.title}`).join('\n')}
**  Escolha um valor de 1-10!**`)).then(m => m.delete(17000))
                     try {
                         var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
                             maxMatches: 1,
                             time: 17000,
                             errors: ['time']
                         });
                     } catch (err) {
                         console.error(err);
                         return message.channel.send(new Discord.RichEmbed()
                         .setColor("#AE05BB")
                         .setTitle(' Não houve escolha de música, seleção cancelada'))
                     }
                     var videoIndex = parseInt(response.first().content);
                     var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                     console.log(`Duração: ${video.duration.seconds}`)
                 } catch (err) {
                     console.error(err);
                     return message.channel.send(new Discord.RichEmbed()
                     .setColor("#AE05BB")
                     .setTitle(' Eu não consegui obter resultados!'))
                 }
             }
             return handleVideo(video, message, voiceChannel);
         }
         break;
       case "skip" || "pular":
         if (!message.member.voiceChannel) return message.channel.send(new Discord.RichEmbed()
         .setColor("#bc9f9f")   
         .setTitle('Você não está conectado a um canal de música!'))
         if (!serverQueue) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Não há nada tocando, para que eu possa pular!'))
         serverQueue.connection.dispatcher.end(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Música pulada!'))
         message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(" Música pulada!'"))
         return undefined;
         break;
       case "stop":
         if (!message.member.voiceChannel) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Você não está conectado a um canal de música!'))
         if (!serverQueue) return message.channel.send(new Discord.RichEmbed()
         .setTitle('Não a nada tocando para que possa parar!'))
         serverQueue.songs = [];
         serverQueue.connection.dispatcher.end('Comando Stop foi usado!')
         message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' A lista de reprodução foi excluida, para ouvir denovo use: \`c!play\`'))
         return undefined;
 break;
       case "volume":
         if (!message.member.voiceChannel) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setDescription(' | Você não está conectado a um canal de música!'))
         if (!serverQueue) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Não há nada tocando!'))
         if (!args[1]) return message.channel.send(new Discord.RichEmbed()
         .setColor("#bc9f9f")
         .setTitle(` Volume atual é: \`${serverQueue.volume}\``))
         serverQueue.volume = args[1];
         serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
         return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(` Volume definido para: \`${args[1]}\``))
 break;
       case "tocando":
         if (!serverQueue) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Não há nada tocando!'))
         return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setDescription(` Tocando agora: \`${serverQueue.songs[0].title}\``))
 break;
       case "lista":
         if (!serverQueue) return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Não há nada tocando!'))
         return message.channel.send(new Discord.RichEmbed()
         .setDescription(` Lista das próximas músicas:
 ${serverQueue.songs.map(song => `\`${song.title}\``).join('\n\n')}`)
.setColor("#AE05BB"))
 break;
       case "pause":
         if (serverQueue && serverQueue.playing) {
             serverQueue.playing = false;
             serverQueue.connection.dispatcher.pause();
             return message.channel.send(new Discord.RichEmbed()
             .setColor("#AE05BB")
             .setTitle(' A listá de reprodução foi pausada, digite ``c!resume`` para continuar.'))
         }
         return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setDescription(' Não há nada tocando!'))
 break;
       case "resume":
         if (serverQueue && !serverQueue.playing) {
             serverQueue.playing = true;
             serverQueue.connection.dispatcher.resume();
             return message.channel.send(new Discord.RichEmbed()
             .setColor("#AE05BB")
             .setTitle(' A lista de reprodução foi resumida.'))
         }
         return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
         .setTitle(' Não há nada tocando!'))
     
 
 break;
 }
 async function handleVideo(video, message, voiceChannel, playlist = false) {
     var serverQueue = queue.get(message.guild.id);
     console.log(video);
     var song = {
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        tumb: video.thumbnails.default.url,
        seg: video.duration.seconds,
       min: video.duration.minutes,
       horas: video.duration.hours,
       canal: video.channel.title
      };
     if (!serverQueue) {
         var queueConstruct = {
             textChannel: message.channel,
             voiceChannel: voiceChannel,
             connection: null,
             songs: [],
             volume: 5,
             playing: true
         };
         queue.set(message.guild.id, queueConstruct);
         queueConstruct.songs.push(song);
 
         try {
                 var connection = await voiceChannel.join();
                 queueConstruct.connection = connection;
                 play(message.guild, queueConstruct.songs[0]);
 
         } catch (error) {
             console.error(`Eu não pude entrar no canal de voz: ${error}`);
             queue.delete(message.guild.id);
             return message.channel.send(new Discord.RichEmbed()
             .setTitle(`Eu não pude entrar no canal devido ao erro: \n\`${error}\``))
         } 
     } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (playlist) return undefined;
         else return message.channel.send(new Discord.RichEmbed()
         .setColor("#AE05BB")
    .setDescription(` Nova música adicionada na fila: \n**•»** Nome: \`\`\n${song.title}\`\`\n**•»** Duração: \`${(song.horas < 10 ? "0" + song.horas : song.horas) + ":" + (song.min < 10 ? "0" + song.min : song.min) + ":" + (song.seg < 10 ? "0" + song.seg : song.seg)}\`\n**•»** Autor: ${message.author}`))}
    return undefined;
 }
   function play(guild, song) {
     var serverQueue = queue.get(guild.id);
 
     if (!song) {
         !serverQueue.voiceChannel.leave();
         queue.delete(guild.id);
         return;
     }
     console.log(serverQueue.songs);
 
     const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
         .on('end', reason => {
       message.channel.send();
             if (reason === 'O fluxo não está gerando com rapidez suficiente.') console.log('Músicas terminadas.');
             else console.log(reason);
             serverQueue.songs.shift();
             play(guild, serverQueue.songs[0]);
         })
         .on('error', error => console.error(error));
     dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
     youtube.searchVideos(args, 1)
     .then(results => {
    moment.locale("pt-BR")
     serverQueue.textChannel.send(new Discord.RichEmbed()
     .setColor("#AE05BB")
     .setImage("https://cdn.discordapp.com/attachments/518223606841344018/525776988368142336/line.png")
     .setThumbnail(results[0].thumbnails.high.url)
     .setDescription(`<a:music:512400492836683791> | Começando a tocar: \n\n**•»** Nome:\`${song.title}\`\n**•»** Duração: \`${(song.horas < 10 ? "0" + song.horas : song.horas) + ":" + (song.min < 10 ? "0" + song.min : song.min) + ":" + (song.seg < 10 ? "0" + song.seg : song.seg)}\`\n**•»** Nome do canal: \`\`\n${results[0].channel.title}\`\`\n**•»** Publicado em: \`\`\n${results[0].publishedAt}\`\`\n**•»** Link: [Clique Aqui](https://youtu.be/${results[0].id})`));
}).catch()
   }
});

let status = [
  {name: 'Meu Comando é c!ajuda', type: 'PLAYING', url: 'Criado Por Caskinha_XD#6412'},
];

client.on('ready', () => {
  console.log('Status carregado!');
  console.log("bot iniciado")
  console.log(`Bot foi iniciado, com ${client.users.size} usuários, em ${client.channels.size} canais, em ${client.guilds.size} servidores.`); 
  function setStatus() {
      let randomStatus = status[Math.floor(Math.random() * status.length)];
      client.user.setPresence({game: randomStatus});
  }

  setStatus();
  setInterval(() => setStatus(), 1000000);
  
});

client.on("message", message => {
  if(message.content.startsWith(client.user)) {

let prefix = 'c!';

  message.channel.send(`${message.author}`)
  message.channel.send(`\`\`\`md\n#💥 | Olá, para ver meus comandos digite ${prefix}ajuda | 💥\`\`\` `);
  message.channel.send(`\`\`\`md\n#💥 | Meu prefix ${prefix} | 💥\`\`\` `);
  }
})

client.on("message", message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;
 
  let command = message.content.split(" ")[0];
  command = command.slice(config.prefix.length);
 
  let args = message.content.split(" ").slice(1);
 
  try {
    let commandsFile = require(`./js/${command}.js`);
    commandsFile.run(client, message, args);
  } catch (err) {
    console.error(err);
  }


});
 
client.login(process.env.TOKEN)