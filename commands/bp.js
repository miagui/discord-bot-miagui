const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
const jsonQ = require("jsonq");
const request = require('request');
const fuzzysort = require('fuzzysort')

const convert = require('../scripts/convert.js')

module.exports.run = (client, message, args, prefix) => {

  // Read the file and send to the callback
  fs.readFile('./json/tf2_items.json', handleFile);

  // Write the callback function
  function handleFile(err, data) {

    if (err) throw err;
    data = JSON.parse(data);

    // You can now play with your datas
      data = data.result.items;
      var itemArg = args.join(" ");
      if (!itemArg) return message.channel.send('Envie um item válido ou mude as palavras.\n`!bp <nomedoitem>`');
      var results = fuzzysort.go(itemArg, data, {key: 'item_name'})

      async function return_promise() {

      //rate = multiplicador da moeda. No caso converte do USD para BRL (3.70~)
      var rate = await convert.usdTo('BRL');

      results = jsonQ(results)
      var item_name = results.find('item_name').value()[0]; //procura pelo array name
      var image_url = results.find('image_url').value()[0];
      var used_by = results.find('used_by_classes').value()[0];

      if (!used_by) {

        var usedBy = ['All-Classes']

      } else {

        var usedBy = used_by

      }

      if (typeof item_name == 'undefined') {

        return message.channel.send('Item não encontrado. Tente enviar mais informações.');

      } else if (item_name.startsWith('The ')) {

        item_name = item_name.slice(4)

      } else {

        item_name = item_name

      }

      //busca a informação do jogo apartir do AppID fornecido antes.
      fs.readFile('./json/bp_price.json', handleBackpack);

      function handleBackpack(err, data2) {

        if (err) throw console.log(err)
        data2 = JSON.parse(data2);

        let bSearch = jsonQ(data2)

        //usd_refined = preço do refinado em usd
        var usd_refined = bSearch.find('raw_usd_value').value()[0]
        //key_price = preço da key em refinado
        var key_price = bSearch.find("Mann Co. Supply Crate Key").find('Craftable').find('value').value()[0]

        let craft = bSearch.find(item_name).find('prices').find('6').find('Craftable').find('value').value();
        let cr_ = bSearch.find(item_name).find('prices').find('6').find('Craftable').find('currency').value();

        let uncraft = bSearch.find(item_name).find('prices').find('6').find('Non-Craftable').find('value').value();
        let uncr_ = bSearch.find(item_name).find('prices').find('6').find('Non-Craftable').find('currency').value();

        let genuine = bSearch.find(item_name).find('prices').find('1').find('value').value();
        let gen_ = bSearch.find(item_name).find('prices').find('1').find('currency').value();

        let vintage = bSearch.find(item_name).find('prices').find('3').find('value').value();
        let vint_ = bSearch.find(item_name).find('prices').find('3').find('currency').value();

        let strange = bSearch.find(item_name).find('prices').find('11').find('value').value();
        let str_ = bSearch.find(item_name).find('prices').find('11').find('currency').value();

        let collector = bSearch.find(item_name).find('prices').find('14').find('value').value();
        let col_ = bSearch.find(item_name).find('prices').find('14').find('currency').value();

        //value é o valor de tantas keys ou metais. Por exemplo: 1.66 Refined
        //currency_type é o tipo de moeda; vêm do uso das variaveis que terminam com '_'
        //exemplo: col_, str_
        const currency = (currency_type, value) => {

          if (currency_type.toString() == 'metal') {

            //se o currency_type for metal, então converta para dinheiro usando multilplicador usd_refined
            return `refined (R$ ${convert.tfCurrencyToMoney('refined', value, usd_refined, rate)})`;

          } else {

            //se o currency_type for key, então converta para dinheiro usando o multiplicador 2.50 (MannCo)
            return `keys (R$ ${convert.tfCurrencyToMoney('key', value, 2.50, rate)})`;

        }
      }

      //Exemplo: quantidade = 21, moeda = refined, qualidade = strange
        const checkIf = (quantidade, moeda, qualidade) => {
          
          let c = currency(moeda, quantidade)

          if (!quantidade.toString() && !moeda.toString()) return

          if (quantidade.length == 2 && moeda.length == 2) return embed.addField(qualidade, `Craftable: __${quantidade[0]} ${c[0]}__\nNon-Craftable: __${quantidade[1]} ${c[1]}__`, true)

          if (quantidade.length == 1 && moeda.length == 1) return embed.addField(qualidade, `Craftable: __${quantidade} ${c}__`, true)
        }

        const uniqueExists = (crft, nonCrft, moeda_crft, moeda_uncrft) => {

          let CraftableCurrency = currency(moeda_crft, crft)

          let UncraftableCurrency = currency(moeda_uncrft, nonCrft)

          if (crft.length && nonCrft.length) return embed.addField('Unique', `Craftable: __${craft} ${CraftableCurrency}__\nNon-Craftable: __${uncraft} ${UncraftableCurrency}__`)
          
          if (crft.length && !nonCrft.length) return embed.addField('Unique', `Craftable: __${craft} ${CraftableCurrency}__`)
          
          if (!crft.length && nonCrft.length) return embed.addField('Unique', `Uncraftable: __${uncraft} ${UncraftableCurrency}__`)
          
          if (!crft.length && !nonCrft.length) return
        }

        const embed = new Discord.RichEmbed()

          .setColor(0x4A90E2)
          .setTitle(`**${item_name}**`)
          .setDescription(`Used by: **${usedBy.join(", ")}**`)
          .setURL(`https://backpack.tf/classifieds?item=${encodeURIComponent(item_name)}`)
          .setFooter("backpack.tf")
          .setThumbnail(image_url)
        uniqueExists(craft, uncraft, cr_, uncr_)
        checkIf(strange, str_, "Strange")
        checkIf(vintage, vint_, 'Vintage')
        checkIf(genuine, gen_, "Genuine")
        checkIf(collector, col_, "Collector")

        message.channel.send({
          embed
        });
      }
    }
    return_promise();
  }
}

module.exports.help = {
  name: 'bp'
}