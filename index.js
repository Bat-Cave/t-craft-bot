// Require the necessary discord.js classes
require("dotenv").config();
const axios = require("axios").default;
const { Client, Intents } = require("discord.js");
const { members } = require("./members");
const { ranks } = require("./ranks");

const discordIDs = [];
Object.keys(members).forEach((k) => discordIDs.push(members[k]));

//INFO POLLING INTERVAL
let getServerData;

// Create a new client instance
const myIntents = new Intents();
myIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS
);
const client = new Client({
  intents: myIntents,
});

// When the client is ready, run this code (only once)
client.once("ready", (c) => {
  const BOT_DEVELOPMENT = "743540729946570904";
  const T_CRAFT = "934573557546094713";
  const list = client.guilds.cache.get(T_CRAFT);
  let scoresObj = {};

  getServerData = setInterval(async () => {
    await axios
      .get(`http://tcraft.mc-join.com:3479/v1/scoreboard/hc_playTime`, {
        headers: {
          key: process.env.T_CRAFT_KEY,
        },
      })
      .then((res) => {
        res.data.scores.forEach((s) => {
          scoresObj[`${s.entry}`] = s.value;
        });

        list.members.list({ limit: 100 }).then((memberList) =>
          memberList.each(async (member) => {
            let dcID = member.user.id;
            let mcName = Object.keys(members).filter(
              (k) => members[k] === dcID
            )[0];

            if (mcName) {
              let roleToGive = ranks.filter(
                (r) =>
                  scoresObj[`${mcName}`] > r.range[0] &&
                  scoresObj[`${mcName}`] < r.range[1]
              )[0].roleID;
              let memberRoleIds = [];
              member.roles.cache.each((r) => memberRoleIds.push(r.id));
              if (!memberRoleIds.includes(roleToGive)) {
                await member.roles.add([roleToGive]);
                let roleName = await list.roles
                  .fetch(roleToGive)
                  .then((r) => r.name);

                console.log(
                  `Updated ${member.user.username}'s role to ${roleName}`
                );
              }
            }
          })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }, 60 * 60 * 1000);

  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("messageCreate", (m) => {
  if (m.content === "!stopChecking") {
    clearInterval(getServerData);
  }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
