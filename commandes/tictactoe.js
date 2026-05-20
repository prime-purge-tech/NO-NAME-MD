// commands/tictactoe.js
import config from "../config.js";
import { getThemePhoto, getThemeStyle, formatThemedMessage, sendThemedMessage, sendThemedText } from "./theme.js";

// Stockage global des parties
const games = new Map();

// ─── Classe TicTacToe ───
class TicTacToe {
    constructor(playerX = 'x', playerO = 'o') {
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = playerX;
        this.turns = 0;
        this.board = [
            '', '', '',
            '', '', '',
            '', '', ''
        ];
        this.winner = null;
    }

    turn(player, index) {
        if (this.winner) return false;
        if (player !== this.currentTurn) return false;
        if (this.board[index] !== '') return false;
        
        this.board[index] = player === this.playerX ? 'X' : 'O';
        this.turns++;
        this.currentTurn = player === this.playerX ? this.playerO : this.playerX;
        
        this.checkWinner();
        return true;
    }

    checkWinner() {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8], // lignes
            [0,3,6], [1,4,7], [2,5,8], // colonnes
            [0,4,8], [2,4,6]           // diagonales
        ];
        
        for (const pattern of winPatterns) {
            const [a,b,c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.winner = this.board[a] === 'X' ? this.playerX : this.playerO;
                return;
            }
        }
    }

    render() {
        return this.board.map(cell => cell || ' ');
    }
}

function getNumero(jid = "") {
    return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

// ─── Commande .ttt ou .tictactoe ───
export default async function tictactoeCommand(message, client, { args } = {}) {
    const remoteJid = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const senderNum = getNumero(senderId);
    const roomName = args[0] || null;
    const photo = getThemePhoto(remoteJid);
    const style = getThemeStyle(remoteJid);

    try {
        // Vérifier si le joueur est déjà dans une partie
        const existingGame = Array.from(games.values()).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId) &&
            room.state !== 'ENDED'
        );

        if (existingGame) {
            return await sendThemedMessage(client, remoteJid, photo, formatThemedMessage(remoteJid, "TIC TAC TOE", [
                "❌ Tu es déjà dans une partie !",
                "📌 Tape *surrender* pour abandonner"
            ]), [], message);
        }

        // Chercher une partie en attente
        let room = Array.from(games.values()).find(room => 
            room.state === 'WAITING' && 
            (roomName ? room.name === roomName : true)
        );

        if (room) {
            // Rejoindre une partie existante
            room.o = remoteJid;
            room.game.playerO = senderId;
            room.state = 'PLAYING';

            const arr = room.game.render().map(v => ({
                'X': '❎',
                'O': '⭕',
                ' ': '⬜'
            }[v]) || '⬜');

            const gameStatus = formatThemedMessage(remoteJid, "TIC TAC TOE", [
                "🎮 *Partie commencée !*",
                "",
                `🎲 Tour de @${getNumero(room.game.currentTurn)}`,
                "",
                `${arr[0]}${arr[1]}${arr[2]}`,
                `${arr[3]}${arr[4]}${arr[5]}`,
                `${arr[6]}${arr[7]}${arr[8]}`,
                "",
                `▢ Joueur ❎ : @${getNumero(room.game.playerX)}`,
                `▢ Joueur ⭕ : @${getNumero(room.game.playerO)}`,
                "",
                "📌 Tape un chiffre (1-9) pour jouer",
                "📌 Tape *surrender* pour abandonner"
            ]);

            const mentions = [room.game.currentTurn, room.game.playerX, room.game.playerO];

            await client.sendMessage(remoteJid, {
                image: { url: photo },
                caption: gameStatus,
                mentions: mentions,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.Newsletter,
                        newsletterName: config.BotName,
                        serverMessageId: 143
                    }
                }
            });

        } else {
            // Créer une nouvelle partie
            const gameId = `tictactoe-${Date.now()}`;
            const game = new TicTacToe(senderId, 'o');
            
            room = {
                id: gameId,
                x: remoteJid,
                o: '',
                game: game,
                state: 'WAITING',
                name: roomName || null
            };

            const waitingMsg = formatThemedMessage(remoteJid, "TIC TAC TOE", [
                "⏳ *En attente d'un adversaire...*",
                "",
                `📌 Tape *.ttt ${roomName || ''}* pour rejoindre !`,
                "",
                `🎮 Créateur : @${senderNum}`
            ]);

            await sendThemedMessage(client, remoteJid, photo, waitingMsg, [senderId], message);
            
            games.set(gameId, room);
        }

    } catch (error) {
        console.error('Erreur tictactoeCommand:', error);
        await sendThemedText(client, remoteJid, formatThemedMessage(remoteJid, "TIC TAC TOE", ["❌ Erreur lors du démarrage de la partie."]), [], message);
    }
}

// ─── Handler pour les mouvements ───
export async function handleTicTacToeMove(message, client) {
    const remoteJid = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const photo = getThemePhoto(remoteJid);
    
    // Trouver la partie du joueur
    const room = Array.from(games.values()).find(room => 
        room.id.startsWith('tictactoe') && 
        [room.game.playerX, room.game.playerO].includes(senderId) && 
        room.state === 'PLAYING'
    );

    if (!room) return;

    const isSurrender = /^(surrender|abandonner|give up)$/i.test(text);
    
    if (!isSurrender && !/^[1-9]$/.test(text)) return;

    // Vérifier le tour (sauf pour abandon)
    if (senderId !== room.game.currentTurn && !isSurrender) {
        await sendThemedText(client, remoteJid, formatThemedMessage(remoteJid, "TIC TAC TOE", ["❌ Ce n'est pas ton tour !"]), [], message);
        return;
    }

    let ok = false;
    
    if (isSurrender) {
        ok = true;
    } else {
        const index = parseInt(text) - 1;
        const isPlayerO = senderId === room.game.playerO;
        ok = room.game.turn(isPlayerO, index);
        
        if (!ok) {
            await sendThemedText(client, remoteJid, formatThemedMessage(remoteJid, "TIC TAC TOE", ["❌ Case déjà prise !"]), [], message);
            return;
        }
    }

    let winner = room.game.winner;
    const isTie = room.game.turns === 9;
    
    const arr = room.game.render().map(v => ({
        'X': '❎',
        'O': '⭕',
        ' ': '⬜'
    }[v]) || '⬜');

    let gameStatus = "";
    let mentions = [room.game.playerX, room.game.playerO];

    if (isSurrender) {
        winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
        gameStatus = formatThemedMessage(remoteJid, "TIC TAC TOE", [
            "🏳️ *ABANDON !*",
            `@${getNumero(senderId)} a abandonné !`,
            `🎉 @${getNumero(winner)} remporte la partie !`
        ]);
        mentions.push(winner);
        
        await client.sendMessage(remoteJid, {
            image: { url: photo },
            caption: gameStatus,
            mentions: mentions,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.Newsletter,
                    newsletterName: config.BotName,
                    serverMessageId: 143
                }
            }
        });
        
        games.delete(room.id);
        return;
    }

    if (winner) {
        gameStatus = formatThemedMessage(remoteJid, "TIC TAC TOE", [
            "🎉 *VICTOIRE !*",
            `🏆 @${getNumero(winner)} gagne la partie !`,
            "",
            `${arr[0]}${arr[1]}${arr[2]}`,
            `${arr[3]}${arr[4]}${arr[5]}`,
            `${arr[6]}${arr[7]}${arr[8]}`
        ]);
        mentions.push(winner);
        games.delete(room.id);
        
    } else if (isTie) {
        gameStatus = formatThemedMessage(remoteJid, "TIC TAC TOE", [
            "🤝 *MATCH NUL !*",
            "La partie se termine sur un match nul.",
            "",
            `${arr[0]}${arr[1]}${arr[2]}`,
            `${arr[3]}${arr[4]}${arr[5]}`,
            `${arr[6]}${arr[7]}${arr[8]}`
        ]);
        games.delete(room.id);
        
    } else {
        gameStatus = formatThemedMessage(remoteJid, "TIC TAC TOE", [
            "🎮 *Partie en cours*",
            "",
            `🎲 Tour de @${getNumero(room.game.currentTurn)} (${senderId === room.game.playerX ? '❎' : '⭕'})`,
            "",
            `${arr[0]}${arr[1]}${arr[2]}`,
            `${arr[3]}${arr[4]}${arr[5]}`,
            `${arr[6]}${arr[7]}${arr[8]}`,
            "",
            `▢ Joueur ❎ : @${getNumero(room.game.playerX)}`,
            `▢ Joueur ⭕ : @${getNumero(room.game.playerO)}`,
            "",
            "📌 Tape un chiffre (1-9) pour jouer",
            "📌 Tape *surrender* pour abandonner"
        ]);
        mentions.push(room.game.currentTurn);
    }

    const messageOptions = {
        image: { url: photo },
        caption: gameStatus,
        mentions: mentions,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.Newsletter,
                newsletterName: config.BotName,
                serverMessageId: 143
            }
        }
    };

    // Envoyer au groupe
    await client.sendMessage(room.x, messageOptions);
    
    // Envoyer aussi à l'autre joueur si c'est un MP
    if (room.x !== room.o && room.o) {
        await client.sendMessage(room.o, messageOptions);
    }
}