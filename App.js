const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, AttachmentBuilder, ActionRowBuilder, EmbedBuilder, ChannelType, ButtonBuilder, TextInputStyle, PermissionFlagsBits, PermissionsBitField, ButtonStyle } = require("discord.js");
const Config = require("./Config.js");
require("advanced-logs");
const allIntents = Object.values(GatewayIntentBits);
const client = new Client({
    intents: [allIntents]
});
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })
require("./Utils/eventLoader.js")(client)
require("./Utils/slashHandler.js")(client)

// Botu Kullanmadan README.md dosyasını okuyun!

// TicketSystem ------------------------------------------------------------------------------------------------

client.on('ready', async () => {
    client.guilds.cache.forEach(async (guild) => {
        const ticketData = await GuildDatas.get(`${guild.id}.TicketSystem.Tickets`);

        if (ticketData) {
            let isDataUpdated = false;

            for (const channelId in ticketData) {
                const channel = guild.channels.cache.get(channelId);

                if (!channel) {
                    GuildDatas.delete(`${guild.id}.TicketSystem.Tickets.${channelId}`);
                    isDataUpdated = true;
                }
            }

            const updatedTicketData = await GuildDatas.get(`${guild.id}.TicketSystem.Tickets`);
            if (!updatedTicketData || Object.keys(updatedTicketData).length === 0) {
                GuildDatas.delete(`${guild.id}.TicketSystem.Tickets`);
            }
        }
    });
});


client.on('channelDelete', async (channel) => {
    const ticketData = await GuildDatas.get(`${channel.guild.id}.TicketSystem.Tickets`);

    if (ticketData && ticketData[channel.id]) {
        GuildDatas.delete(`${channel.guild.id}.TicketSystem.Tickets.${channel.id}`);

        const updatedTicketData = await GuildDatas.get(`${channel.guild.id}.TicketSystem.Tickets`);

        if (!updatedTicketData || Object.keys(updatedTicketData).length === 0) {
            GuildDatas.delete(`${channel.guild.id}.TicketSystem.Tickets`);
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.values && interaction.values.length > 0) {
            for (const value of interaction.values) {
                if (value.startsWith("ticketCreate-")) {
                    const trueValue = value.split('-')[1];

                    if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                        (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id)) {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("⚠️ Hata!")
                                    .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                                        (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
                                    )}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                                    .setFooter({ text: "Bu bot Tyial tarafından kodlanmıştır." })
                                    .setColor("Red"),],
                            ephemeral: true,
                        });
                        return interaction.message.edit({ ephemeral: false });
                    }

                    const reasonModal = new ModalBuilder()
                        .setCustomId(`reason-modal-${trueValue}`)
                        .setTitle('Sebep Belirtiniz');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('reason-input')
                        .setLabel('Sebep:')
                        .setPlaceholder('Lütfen en az 10 karakterlik bir sebep belirtiniz')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(200)
                        .setRequired(true);

                    const modalActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    reasonModal.addComponents(modalActionRow);

                    await interaction.showModal(reasonModal);
                    await interaction.message.edit({ ephemeral: false });
                }
            }
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("reason-modal-")) {
            const reason = interaction.fields.getTextInputValue('reason-input');
            const value = interaction.customId.replace('reason-modal-', '');

            const now = Date.now();
            const newDate = Math.floor(now / 1000);
            const categoryID = interaction.guild.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.CategoryID`));
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
            )) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Hata!")
                            .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${DejaUnChannel}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setColor("Red"),],
                    ephemeral: true,
                });
                return interaction.message.edit({ ephemeral: false });
            } else {
                const supportChannel = await interaction.guild.channels.create({
                    name: `talep-${interaction.user.username}`,
                    topic: `Talep Sahibi: <@${interaction.user.id}>`,
                    type: ChannelType.GuildText,
                    parent: categoryID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: roleStaff,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ],
                }
                );

                await GuildDatas.set(`${interaction.guild.id}.TicketSystem.Tickets.${supportChannel.id}.AuthorID`, interaction.member.id)

                await interaction.reply({
                    content: `**Destek talebiniz ${value} sebebiyle başarıyla açıldı:** ${supportChannel}`,
                    ephemeral: true,
                });
                await interaction.message.edit({ ephemeral: false });
                const MessageReply = await supportChannel.send({
                    content: `<@${interaction.user.id}> **|** ${roleStaff}`,
                    embeds: [new EmbedBuilder()
                        .setTitle(`Destek Talebi`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .addFields(
                            {
                                name: `👍 **Destek talebiniz yetkililere bildirildi. Lütfen sabırla bekleyiniz.**`,
                                value: ` `
                            },
                            {
                                name: `👥 **Talebi Açan Üye:**`,
                                value: `**・** ${interaction.user}`,
                                inline: true
                            },
                            {
                                name: `📅 **Talep Açılış Tarihi:**`,
                                value: `**・** <t:${newDate}:R>`,
                                inline: true
                            },
                            {
                                name: `🔔 **Talebin Kategorisi:**`,
                                value: `**・** \`${value}\``,
                                inline: true
                            },
                            {
                                name: `❓ **Talebin Açılış Sebebi:**`,
                                value: `**・** \`${reason}\``,
                                inline: true
                            }
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
                await MessageReply.pin();
            }
        }
        if (interaction.customId.startsWith("add-member")) {
            const Channel = interaction.channel;
            const targetMember = await interaction.guild.members.fetch(interaction.fields.getTextInputValue("member-id"));

            if (!targetMember) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Başarısız!`)
                            .setColor("Red")
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(`
                        ❌ **Bu kullanıcı sunucuda bulunamadığından destek talebine eklenemedi.**
                        `)
                    ],
                    ephemeral: true,
                });
            }

            if (
                targetMember &&
                Channel.permissionsFor(targetMember)?.has(PermissionFlagsBits.ViewChannel) ||
                targetMember.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                return interaction.reply({
                    content: `**Bu kullanıcı zaten talebi görüntüleyebiliyor!**`,
                    ephemeral: true,
                });
            }

            await Channel.permissionOverwrites.edit(targetMember, {
                [PermissionFlagsBits.ViewChannel]: true,
            });


            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setAuthor({ name: `Destek Sistemi`, iconURL: "https://media.discordapp.net/attachments/909508451712000051/1252681018620645436/alphalogo.png?ex=6686375c&is=6684e5dc&hm=0dbb9681e142fb7ba0ff6afa471bf2958e91e4e827ab6772d3d37a1d81021eda&=&format=webp&quality=lossless&width=80&height=80" })
                    .setColor("Green")
                    .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                    .setDescription(`
                🎫 **${targetMember} adlı üye destek talebine eklendi.**
                ⭐ **Üyeyi Destek Talebine Ekleyen Yetkili:** <@${interaction.user.id}> **(** \`${interaction.user.id}\` **)**
                `)
                ],
            });
        }
        if (interaction.customId.startsWith("remove-member")) {
            const Channel = interaction.channel;
            const targetMember = await interaction.guild.members.fetch(interaction.fields.getTextInputValue("member-id"));

            if (!targetMember) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(`0x0099ff`)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                    ❌ **Bu kullanıcı sunucuda bulunamadığından destek talebinden çıkartılamadı.**
                    `)],
                    ephemeral: true,
                });
            }
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`) === interaction.fields.getTextInputValue("member-id")) {
                return interaction.reply({ content: "Talebin sahibini talepten çıkartamazsınız.", ephemeral: true })
            }

            if (
                targetMember &&
                !Channel.permissionsFor(targetMember)?.has(PermissionFlagsBits.ViewChannel) ||
                targetMember.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                return interaction.reply({
                    content: `**Bu kullanıcı zaten talebi görüntüleyemiyor!**`,
                    ephemeral: true,
                });
            }

            await Channel.permissionOverwrites.edit(targetMember, {
                [PermissionFlagsBits.ViewChannel]: false,
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Destek Sistemi`, iconURL: "https://media.discordapp.net/attachments/909508451712000051/1252681018620645436/alphalogo.png?ex=6686375c&is=6684e5dc&hm=0dbb9681e142fb7ba0ff6afa471bf2958e91e4e827ab6772d3d37a1d81021eda&=&format=webp&quality=lossless&width=80&height=80" })
                        .setColor("2f3136")
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                🎫 **${targetMember} adlı üye destek talebinden çıkartıldı.**
                ⭐ **Üyeyi Destek Talebinden Çıkartan Yetkili:** <@${interaction.user.id}> **(** \`${interaction.user.id}\` **)**
                `)
                ],
            });
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticketCreate-")) {
            const trueValue = interaction.customId.split('-')[1];

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id)) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Hata!")
                            .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
                            )}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                            .setFooter({ text: "Bu bot Tyial tarafından kodlanmıştır." })
                            .setColor("Red"),],
                    ephemeral: true,
                });
                return interaction.message.edit({ ephemeral: false });
            }

            const reasonModal = new ModalBuilder()
                .setCustomId(`reason-modal-${trueValue}`)
                .setTitle('Sebep Belirtiniz');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason-input')
                .setLabel('Sebep:')
                .setPlaceholder('Lütfen en az 10 karakterlik bir sebep belirtiniz')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10)
                .setMaxLength(200)
                .setRequired(true);

            const modalActionRow = new ActionRowBuilder().addComponents(reasonInput);
            reasonModal.addComponents(modalActionRow);

            await interaction.showModal(reasonModal);
            await interaction.message.edit({ ephemeral: false });
        }
        if (interaction.customId === "ticket-kapat") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            let devralStatus = false
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                devralStatus = true
            }

            if (!user) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                    ❌ **Bu kullanıcı sunucudan ayrıldığı için destek talebini kapatamıyorum.**
                    👍 **Destek talebini silmek için aşağıdaki butona tıkla!**
                    `)],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setDisabled(true)
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(devralStatus)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            if (
                !channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel) &&
                !user.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `**Bu destek talebi zaten kapalı!**`,
                    ephemeral: true,
                });

            if (user.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Yönetici Üye Hatası!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                    ⚠️ **Bu destek talebinin sahibi'nin yönetici yetkisi olduğu için kanalı kapatamazsınız!**
                    👍 **Aşağıdaki Destek Talebini Sil butonu ile kanalı silebilirsiniz.**
                    `)],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setDisabled(true)
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(devralStatus)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            await interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-kapat')
                            .setLabel(`Destek Talebini Kapat`)
                            .setStyle('Danger')
                            .setDisabled(true)
                            .setEmoji("🔒"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });
            await channel.permissionOverwrites.edit(user, {
                [PermissionsBitField.Flags.ViewChannel]: false,
            });

            await interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });

            let allMessages = [];
            let lastMessageId;
            let userMessageCount = {};

            while (true) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;
                allMessages = [...messages.values(), ...allMessages];
                lastMessageId = messages.last().id;
            }

            let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
            let hasUserMessages = false;

            allMessages.reverse().forEach(msg => {
                if (msg.author.bot) return;

                if (!userMessageCount[msg.author.username]) {
                    userMessageCount[msg.author.username] = { count: 0, messages: [] };
                }
                userMessageCount[msg.author.username].count++;
                userMessageCount[msg.author.username].messages.push({
                    timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                    content: `${msg.content}\n`,
                    username: `**${msg.author.username}**`
                });
                hasUserMessages = true;
            });

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (hasUserMessages) {
                const sortedUsers = Object.entries(userMessageCount)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5);

                sortedUsers.forEach(([username, { count }], index) => {
                    mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                });

                mdContent += '\n### Mesajlar\n\n';

                let allMessagesSorted = [];

                sortedUsers.forEach(([username, { messages }]) => {
                    allMessagesSorted = allMessagesSorted.concat(messages);
                });

                allMessagesSorted.sort((a, b) => {
                    return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                });

                let lastUsername = null;

                allMessagesSorted.forEach(message => {
                    if (lastUsername === message.username) {
                        mdContent += `${message.content}`;
                    } else {
                        if (lastUsername !== null) {
                            mdContent += '\n';
                        }
                        mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                        lastUsername = message.username;
                    }
                });

                const buffer = Buffer.from(mdContent, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )],
                    files: [attachment],
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    files: [attachment],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${roleStaff}`,
                embeds: [new EmbedBuilder()
                    .setTitle(`Destek Talebi Kapatıldı!`)
                    .setColor(0x0099ff)
                    .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                    .setDescription(`
          🔒 **Destek talebi başarıyla kapatıldı!**
          👤 **Destek talebini kapatan kişi:** <@${interaction.user.id}>
          👍 **Destek Talebini Sil butonuna basarak destek talebini silebilir, Destek Talebini Aç butonuna basarak destek talebini geri açabilirsiniz!**
        `)],
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId('ticket-aç')
                            .setLabel(`Destek Talebini Aç`)
                            .setStyle('Primary')
                            .setEmoji("🔓")
                    ]
                }],
                ephemeral: false,
            });
            return interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-kapat')
                            .setLabel(`Destek Talebini Kapat`)
                            .setStyle('Danger')
                            .setDisabled(true)
                            .setEmoji("🔒"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });
        }
        if (interaction.customId === "ticket-aç") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let devralStatus = false
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                devralStatus = true
            }

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            if (!user)
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(`0x0099ff`)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                        🔒 **Bu kullanıcı sunucudan ayrıldığı için bileti açamıyorum.**
                        👍 **Destek talebini için aşağıdaki butona tıkla!**
                        `)
                    ],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
            if (channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel))
                return interaction.reply({
                    content: `**Bu destek talebi zaten açık!**`,
                    ephemeral: true,
                });

            await channel.permissionOverwrites.edit(user, {
                [PermissionsBitField.Flags.ViewChannel]: true,
            });

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${user} | ${roleStaff}`,
                embeds: [new EmbedBuilder()
                    .setTitle(`Destek Talebi Tekrardan Açıldı!`)
                    .setColor(0x0099ff)
                    .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                    .setDescription(`
                    🔓 **Destek talebi tekrardan açıldı!**
                    👤 **Destek biletini açan kişi:** <@${interaction.user.id}>
                    👍 **Destek talebini butonuna basarak destek talebini kapatabilirsiniz.**
                    `)],
                components: [{
                    type: 1,
                    components: [new ButtonBuilder()
                        .setCustomId('ticket-kapat2')
                        .setLabel(`Destek Talebini Kapat`)
                        .setStyle('Danger')
                        .setEmoji("🔒")]
                }],
            });
            interaction.message.delete();
        }
        if (interaction.customId === "ticket-kapat2") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            if (!user)
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Başarısız!`)
                            .setColor(0x0099ff)
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(`
                        ❌ **Bu kullanıcı sunucudan ayrıldığı için destek talebini kapatamıyorum.**
                        👍 **Destek talebini silmek için aşağıdaki butona tıkla!**
                        `)
                    ],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️")
                        ]
                    }],
                });

            if (
                !channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel) &&
                !user.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `🔒 **Bu destek talebi zaten kapalı!**`,
                    ephemeral: true,
                });

            if (user.permissions.has(PermissionFlagsBits.Administrator))
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Yönetici Üye Hatası!`)
                            .setColor(0x0099ff)
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(`
                        ⚠️ **Bu destek talebinin sahibi'nin yönetici yetkisi olduğu için kanalı kapatamazsınız!**
                        👍 **Aşağıdaki Destek Talebini Sil butonu ile kanalı silebilirsiniz.**
                        `)
                    ],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️")
                        ]
                    }],
                });

            await channel.permissionOverwrites.edit(user, {
                [PermissionFlagsBits.ViewChannel]: false,
            });

            let allMessages = [];
            let lastMessageId;
            let userMessageCount = {};

            while (true) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;
                allMessages = [...messages.values(), ...allMessages];
                lastMessageId = messages.last().id;
            }

            let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
            let hasUserMessages = false;

            allMessages.reverse().forEach(msg => {
                if (msg.author.bot) return;

                if (!userMessageCount[msg.author.username]) {
                    userMessageCount[msg.author.username] = { count: 0, messages: [] };
                }
                userMessageCount[msg.author.username].count++;
                userMessageCount[msg.author.username].messages.push({
                    timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                    content: `${msg.content}\n`,
                    username: `**${msg.author.username}**`
                });
                hasUserMessages = true;
            });

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (hasUserMessages) {
                const sortedUsers = Object.entries(userMessageCount)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5);

                sortedUsers.forEach(([username, { count }], index) => {
                    mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                });

                mdContent += '\n### Mesajlar\n\n';

                let allMessagesSorted = [];

                sortedUsers.forEach(([username, { messages }]) => {
                    allMessagesSorted = allMessagesSorted.concat(messages);
                });

                allMessagesSorted.sort((a, b) => {
                    return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                });

                let lastUsername = null;

                allMessagesSorted.forEach(message => {
                    if (lastUsername === message.username) {
                        mdContent += `${message.content}`;
                    } else {
                        if (lastUsername !== null) {
                            mdContent += '\n';
                        }
                        mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                        lastUsername = message.username;
                    }
                });

                const buffer = Buffer.from(mdContent, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )],
                    files: [attachment],
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    files: [attachment],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${user} | ${roleStaff}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Destek Talebi Kapatıldı!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(`
                      🔒 **Destek talebi başarıyla kapatıldı!**
                      👤 **Destek talebini kapatan kişi:** <@${interaction.user.id}>
                      👍 **Destek Talebini Sil butonuna basarak destek talebini silebilir, Destek Talebini Aç butonuna basarak destek talebini geri açabilirsiniz!**
                    `)
                ],
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId('ticket-aç')
                            .setLabel(`Destek Talebini Aç`)
                            .setStyle('Primary')
                            .setEmoji("🔓")
                    ]
                }],
                ephemeral: false,
            });
            interaction.message.delete();
        }
        if (interaction.customId === "ticket-sil") {
            interaction.reply({ content: "Talep kapatılıyor..." })

            const member = interaction.guild.members.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`));

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (!member || member.permissions.has(PermissionFlagsBits.Administrator)) {
                const channel = interaction.channel;
                let allMessages = [];
                let lastMessageId;
                let userMessageCount = {};

                while (true) {
                    const options = { limit: 100 };
                    if (lastMessageId) {
                        options.before = lastMessageId;
                    }

                    const messages = await channel.messages.fetch(options);
                    if (messages.size === 0) break;
                    allMessages = [...messages.values(), ...allMessages];
                    lastMessageId = messages.last().id;
                }

                let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
                let hasUserMessages = false;

                allMessages.reverse().forEach(msg => {
                    if (msg.author.bot) return;

                    if (!userMessageCount[msg.author.username]) {
                        userMessageCount[msg.author.username] = { count: 0, messages: [] };
                    }
                    userMessageCount[msg.author.username].count++;
                    userMessageCount[msg.author.username].messages.push({
                        timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                        content: `${msg.content}\n`,
                        username: `**${msg.author.username}**`
                    });
                    hasUserMessages = true;
                });

                if (hasUserMessages) {
                    const sortedUsers = Object.entries(userMessageCount)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 5);

                    sortedUsers.forEach(([username, { count }], index) => {
                        mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                    });

                    mdContent += '\n### Mesajlar\n\n';

                    let allMessagesSorted = [];

                    sortedUsers.forEach(([username, { messages }]) => {
                        allMessagesSorted = allMessagesSorted.concat(messages);
                    });

                    allMessagesSorted.sort((a, b) => {
                        return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                    });

                    let lastUsername = null;

                    allMessagesSorted.forEach(message => {
                        if (lastUsername === message.username) {
                            mdContent += `${message.content}`;
                        } else {
                            if (lastUsername !== null) {
                                mdContent += '\n';
                            }
                            mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                            lastUsername = message.username;
                        }
                    });

                    const buffer = Buffer.from(mdContent, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                    client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(
                                `🎫 **${channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                            )],
                        files: [attachment],
                    });

                    authorUser.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(
                                `🎫 **${channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebinizi Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                            )],
                        files: [attachment],
                        components: [{
                            type: 1, components: [
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐ (1)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐ (2)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐ (3)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐ (4)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                    .setStyle(ButtonStyle.Primary)
                            ]
                        }]
                    });
                } else {
                    client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(
                                `🎫 **${channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                            )]
                    });

                    authorUser.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                            .setDescription(
                                `🎫 **${channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebinizi Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                            )],
                        components: [{
                            type: 1, components: [
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐ (1)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐ (2)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐ (3)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐ (4)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                    .setStyle(ButtonStyle.Primary)
                            ]
                        }]
                    });
                }
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${interaction.channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebini Oluşturan:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                        .setDescription(
                            `🎫 **${interaction.channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            interaction.channel.send({ content: "Kanal siliniyor..." })

            setTimeout(() => {
                interaction.channel.delete();
            }, 1000);
        }
        if (interaction.customId === "ticket-member-add") {
            const user = interaction.member;

            if (!user.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Üye ekleyebilmek için gerekli rollere sahip değilsiniz.",
                    ephemeral: true,
                });
            }

            const NewModal = new ModalBuilder()
                .setCustomId(`add-member`)
                .setTitle("Üye Ekleme Formu");

            let MemberID = new TextInputBuilder()
                .setCustomId("member-id")
                .setPlaceholder(`Eklenecek üyenin ID'si nedir?`)
                .setLabel("Eklenecek üyenin ID'sini belirtiniz.")
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(20)
                .setRequired(true);

            const MemberIDInput = new ActionRowBuilder().addComponents(MemberID);
            NewModal.addComponents(MemberIDInput);

            await interaction.showModal(NewModal);
        }
        if (interaction.customId === "ticket-member-remove") {
            const user = interaction.member;

            if (!user.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Üye çıkartabilmek için gerekli rollere sahip değilsiniz.",
                    ephemeral: true,
                });
            }

            const NewModal = new ModalBuilder()
                .setCustomId(`remove-member`)
                .setTitle("Üye Çıkartma Formu");

            let MemberID = new TextInputBuilder()
                .setCustomId("member-id")
                .setPlaceholder(`Çıkartılacak üyenin ID'si nedir?`)
                .setLabel("Çıkartılacak üyenin ID'sini belirtiniz.")
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(20)
                .setRequired(true);

            const MemberIDInput = new ActionRowBuilder().addComponents(MemberID);
            NewModal.addComponents(MemberIDInput);

            await interaction.showModal(NewModal);
        }
        if (interaction.customId === "ticket-devral") {
            const member = interaction.member;

            const ticketMember = await interaction.guild.members.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`));

            if (!member.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Talebi devralmak için yetkili rolüne sahip olmanız gereklidir.",
                    ephemeral: true
                });
            }

            if (!ticketMember) {
                await interaction.reply({
                    content: "Talebin sahibi sunucuda olmadığı için talebi devralmanıza gerek kalmadı. Yukarıdaki mesajdan talebi silebilirsiniz.",
                    ephemeral: true
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(true)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setDisabled(true)
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setDisabled(true)
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            if (ticketMember === interaction.member) {
                return interaction.reply({
                    content: `Kendi talebini devralamazsın.`,
                    ephemeral: true
                })
            }

            if (
                !interaction.channel.permissionsFor(ticketMember).has(PermissionFlagsBits.ViewChannel) &&
                !ticketMember.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `🔒 **Bu destek talebi kapalı olduğu için devralmaya gerek yok. Silerek talebi sonlandırabilirsiniz.**`,
                    ephemeral: true,
                });

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                return interaction.reply({
                    content: `Talep zaten <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}> tarafından devralınmış.`,
                    ephemeral: true
                })
            } else {
                await GuildDatas.set(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`, interaction.user.id)
                await interaction.reply({
                    content: `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> Talep ${interaction.member} tarafından devralındı. Artık ${interaction.member} sizinle ilgilenecek.`
                })
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(true)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }
        }
        if (interaction.customId.startsWith('ticketClose_Staring_')) {
            const parts = interaction.customId.split('_');
            const numberPart = parts[2];
            const guildId = parts[3];
            const channelId = parts[4];
            const channelName = parts.slice(5).join('_');

            const user = await client.users.fetch(interaction.user.id);
            const dmChannel = await user.createDM();

            const fetchedMessage = await dmChannel.messages.fetch(interaction.message.id);

            await client.channels.cache.get(GuildDatas.get(`${guildId}.TicketSystem.Configure.LogChannelID`)).send({
                embeds: [new EmbedBuilder()
                    .setTitle("Bir üye talebi değerlendirdi.")
                    .setDescription(`**${interaction.user.username}** adlı kullanıcı, kapatılan **${channelName}** \`(${channelId})\` adlı talebi değerlendirdi.\nTalebe **5** üzerinden **${numberPart}** puan verdi.`)
                    .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                    .setTimestamp()
                    .setColor("DarkBlue")
                ]
            })
            await interaction.reply({
                content: `Talebi başarıyla değerlendirdiniz.`,
                ephemeral: true
            });
            return fetchedMessage.edit({
                components: [],
            });
        }
        if (interaction.customId.startsWith('ticketDelete_Staring_')) {
            const parts = interaction.customId.split('_');
            const numberPart = parts[2];
            const guildId = parts[3];
            const channelId = parts[4];
            const channelName = parts.slice(5).join('_');

            const user = await client.users.fetch(interaction.user.id);
            const dmChannel = await user.createDM();

            const fetchedMessage = await dmChannel.messages.fetch(interaction.message.id);

            await client.channels.cache.get(GuildDatas.get(`${guildId}.TicketSystem.Configure.LogChannelID`)).send({
                embeds: [new EmbedBuilder()
                    .setTitle("Bir üye talebi değerlendirdi.")
                    .setDescription(`**${interaction.user.username}** adlı kullanıcı, silinen **${channelName}** \`(${channelId})\` adlı talebi değerlendirdi.\nTalebe **5** üzerinden **${numberPart}** puan verdi.`)
                    .setTimestamp()
                    .setFooter({ text: "Bu altyapı Tyial tarafından kodlanmış ve paylaşılmıştır." })
                    .setColor("DarkBlue")
                ]
            })
            await interaction.reply({
                content: `Talebi başarıyla değerlendirdiniz.`,
                ephemeral: true
            });
            return fetchedMessage.edit({
                components: [],
            });
        }
    }
});

// TicketSystem ------------------------------------------------------------------------------------------------

// CrashHandler ------------------------------------------------------------------------------------------------
process.on('unhandledRejection', (reason, p) => {
    console.error(reason);
});
process.on("uncaughtException", (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch');
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch (MONITOR)');
});
// CrashHandler ------------------------------------------------------------------------------------------------

// Botu Kullanmadan README.md dosyasını okuyun!
client.login(Config.Token);
