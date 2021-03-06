const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const _ = require('lodash');
const jsonQ = require("jsonq");
const request = require('request');
const fuzzysort = require('fuzzysort')

module.exports.run = (client, message, args, prefix) => {

    // Read the file and send to the callback
    fs.readFile('./json/preços.json', handleFile);

    // Write the callback function
    function handleFile(err, data) {

        if (err) throw err;
        prices = JSON.parse(data);
        // You can now play with your datas

        let Store = prices.applist.apps;
        let gameArg = args.join(" "); //argumento usado no comando i.e (!store 'argumento')
        if (!gameArg) return message.channel.send('Envie um jogo válido.\n`!store <game>`');
        const argFilter = fuzzysort.go(gameArg, Store, {key:'name'})
        var searchAppid = jsonQ(argFilter),

            //to find all the name

            id = searchAppid.find('appid'); //procura pelo array appid
        AppID = id.value()
        //busca a informação do jogo apartir do AppID fornecido antes.
        request(`http://store.steampowered.com/api/appdetails?appids=${AppID[0]}&cc=br`, function (error, response, body) {
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);
            console.log(`Link: http://store.steampowered.com/api/appdetails?appids=${AppID[0]}&cc=br&filters=price_overview`)

            var gameInfo = jsonQ(body);
            initialPrice = gameInfo.find('initial').value();
            finalPrice = gameInfo.find('final').value();
            discountPercent = gameInfo.find('discount_percent').value();
            releaseDate = gameInfo.find('date').value()

            const numberDot = (price) => {

                if (price.toString().length == 3) {
                    return price.toString().slice(0, 1) + ',' + price.toString().slice(1, 3)

                } else if (price.toString().length == 4) {

                    return price.toString().slice(0, 2) + ',' + price.toString().slice(2, 4)

                } else if (price.toString().length == 5) {

                    return price.toString().slice(0, 3) + ',' + price.toString().slice(3, 5) 

                } else {
                    
                    return price.toString().slice(0, 4) + ',' + price.toString().slice(4, 6)
                }
            }
            //maneira util de verificar se foi encontrado algum preço. Se
            if (initialPrice.length >= 1 && discountPercent >= 1) {

                message.channel.send(`Preço inicial: R$${numberDot(initialPrice)}              
Preço em promoção: R$${numberDot(finalPrice)} (${discountPercent}% desconto)
Data de lançamento: ${releaseDate.toString()}
https://store.steampowered.com/app/${AppID[0]}`);

            //se não houver preço, mas haver um AppID, então o jogo é free to play.
            } else if (initialPrice.length == 0 && AppID[0]) {

                message.channel.send(`Data de lançamento: ${JSON.stringify(releaseDate.toString())}\nhttps://store.steampowered.com/app/${AppID[0]}`)

            } else if (initialPrice.length >= 1 && discountPercent == 0) {

                message.channel.send(`Preço: R$${numberDot(initialPrice)}\nSem promoção para esse jogo no momento.\nData de lançamento: ${releaseDate.toString()}\nhttps://store.steampowered.com/app/${AppID[0]}`);

            } else {

                message.channel.send(`Jogo não encontrado.`)
                
            }
        });
    }
}

module.exports.help = {
    name: 'store' //nome do comando
}