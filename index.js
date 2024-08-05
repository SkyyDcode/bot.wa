const wppconnect = require('@wppconnect-team/wppconnect');
const sharp = require('sharp');
const path = require('path');

const keywords = ["apa", "dimana", "p", "hallo", "hari", "hai", "login", "woi", "rek", "oi", "sek", "meh", "yok", "rk", "huum", "iya", "iy", "ayo", "ayok", "lojin", "iso", "rk"];
const brokens = ["yanto", "penno"];
const warnings = ["tartar", "babi", "asu", "bangsat", "memek", "kontol", "pukimak", "asw", "ngentot", "mek", "jancok"];
const tebakTeki = [
  { question: "Saya berjalan tanpa kaki. Siapakah saya?", answer: "Jam" },
  { question: "Semakin tua, semakin kuat. Apakah itu?", answer: "Anggur" },
  { question: "Saya selalu di depan mata, tapi tidak pernah terlihat. Siapakah saya?", answer: "Masa depan" },
  { question: "Apa yang selalu datang, tapi tidak pernah tiba?", answer: "Besok" },
  { question: "Saya ada di mana-mana, tapi tidak terlihat. Apakah itu?", answer: "Udara" },
  { question: "Saya bisa terbang tanpa sayap. Apakah saya?", answer: "Waktu" },
  { question: "Saya punya banyak kunci, tapi tidak bisa membuka pintu. Apakah saya?", answer: "Piano" },
  { question: "Saya punya leher, tapi tidak punya kepala. Apakah saya?", answer: "Botol" },
  { question: "Saya adalah kata yang salah eja. Apakah saya?", answer: "Salah eja" },
  { question: "Semakin banyak kamu mengambil, semakin besar aku. Apa aku?", answer: "Lubang" },
  { question: "Saya ada di tengah lautan, tapi tidak basah. Apakah saya?", answer: "Huruf 'o'" }
];
const letters = 'abcdefghijklmnopqrstuvwxyz';
let userGameStatus = {};
let messages = [];

// Fungsi untuk membuat stiker dari pesan media
async function createSticker(client, message) {
  try {
    console.log('Decrypting file...');
    const mediaData = await client.decryptFile(message);
    console.log('File decrypted successfully.');

    if (!Buffer.isBuffer(mediaData)) {
      throw new Error('Media data is not a buffer.');
    }

    const imageBuffer = await sharp(mediaData)
      .resize({ width: 512, height: 512, fit: 'contain' })
      .webp()
      .toBuffer();
    console.log('Image resized and converted to webp.');

    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    console.log('Image converted to base64.');

    // Send the base64 image as a sticker
    await client.sendImageAsSticker(message.from, `data:image/webp;base64,${base64Image}`);
    console.log('Sticker created and sent successfully.');
  } catch (error) {
    console.error('Error creating sticker:', error);
    await client.reply(message.from, 'Failed to create sticker: ' + error.message, message.id);
  }
}

// Fungsi utama yang dijalankan saat bot mulai
async function start(client) {
  client.onMessage(async (message) => {
    if (!message || !message.body || message.quotedMsgId) {
      console.log("Quoted or invalid message received, skipping reply.");
      return;
    }

    console.log("Pesan diterima:", message.body);
    messages.push(message.body);

    const words = message.body.toLowerCase().split(" ");
    const response = await handleMessage(client, message, words);

    if (response) {
      await client.reply(message.from, response, message.id);
    }
  });

  client.onStateChange((state) => {
    if (['CONFLICT', 'UNLAUNCHED', 'DISCONNECTED'].includes(state)) {
      console.log('Koneksi terputus. Mencoba menyambung kembali...');
      wppconnect.create().then(start).catch(error => console.error('Error restarting client:', error));
    }
  });
}

// Fungsi untuk menangani pesan yang diterima
async function handleMessage(client, message, words) {
  const userId = message.from;
  const username = message.sender.pushname || message.sender.formattedName || "Pengguna";

  if (words.some(word => keywords.includes(word))) {
    return `Hallo ${username}, saya adalah SkyyBot. Ada yang bisa saya bantu?`;
  }
  if (words.some(word => brokens.includes(word))) {
    return "Anda tidak sopan";
  }
  if (words.some(word => warnings.includes(word))) {
    return "Anda berkata kasar";
  }

  switch (message.body.toLowerCase()) {
    case '/info':
      return `Hallo ${username}!\n\nSaya adalah SkyyBot, asisten digital anda. 
Bot ini sedang dalam masa pengembangan
Silakan masukkan saran agar bot ini bisa berkembang.

Beberapa fitur yang bisa digunakan adalah
~informasi:
/info (untuk mengetahui info tentang bot ini)
.sebut-namaku (untuk sekedar menyapa user)
.sayang (tidak diperuntukan untuk orang lain)

~permainan:
.tebak-teki (permainan teka teki)
.tebak-kata (permainan tebak kata)

~bantuan:
.clue (untuk mengetahui clue permainan tebak kata)
.berhenti (untuk menghentikan sekaligus memberikan jawaban untuk teka teki)
.stop (untuk menghentikan permainan tebak kata)

Salam hangat SkyyBot
(Owner: RidhoSlebeww)`;

    case 'sayang':
      return 'Dalem sayang, kenapa sayang?';

    case '.sebut-namaku':
      return `Hallo ${username}! Apa kabar hari ini?`;

    case '.tebak-teki':
      const randomTekaTeki = tebakTeki[Math.floor(Math.random() * tebakTeki.length)];
      userGameStatus[userId] = randomTekaTeki;
      return `Teka-teki: ${randomTekaTeki.question}`;

    case '.berhenti':
      if (userGameStatus[userId]) {
        const answer = userGameStatus[userId].answer;
        delete userGameStatus[userId];
        return `Permainan dihentikan. Jawaban dari teka-teki terakhir adalah: ${answer}`;
      }
      return `Tidak ada permainan teka-teki yang sedang berjalan.`;

    case '.tebak-kata':
      const randomLetters = Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      userGameStatus[userId] = { letters: randomLetters };
      return `Buat kata dari huruf berikut: ${randomLetters}\nPetunjuk: Anda bisa meminta 'clue' dengan mengetik '.clue'`;

    case '.clue':
      if (userGameStatus[userId] && userGameStatus[userId].letters) {
        const { letters } = userGameStatus[userId];
        const clue = letters.split('').sort(() => 0.5 - Math.random()).join('');  // Shuffle letters
        return `Petunjuk: Kata yang bisa dibuat dari huruf: ${clue}`;
      }
      return `Tidak ada permainan tebak kata yang sedang berjalan.`;

    case '.stop':
      if (userGameStatus[userId]) {
        const { letters } = userGameStatus[userId];
        delete userGameStatus[userId];
        return `Permainan dihentikan. Huruf yang digunakan adalah: ${letters}`;
      }
      return `Tidak ada permainan kata yang sedang berjalan.`;

    default:
      if (userGameStatus[userId]) {
        const { letters } = userGameStatus[userId];
        const userWord = message.body.toLowerCase();

        if (userWord.split('').every(letter => letters.includes(letter))) {
          delete userGameStatus[userId];
          return 'Bagus! Kata Anda valid!';
        } else {
          return 'Kata Anda tidak valid. Coba lagi!';
        }
      }

      if (message.body.toLowerCase() === '.sticker' && (message.isMedia || message.type === 'image' || message.type === 'video')) {
        await createSticker(client, message);
        return null;
      }

      return null;
  }
}

// Fungsi untuk mencetak semua pesan yang diterima (hanya untuk debugging)
function printMessages() {
  console.log("Semua pesan yang diterima:");
  messages.forEach((msg, index) => {
    console.log(`${index + 1}: ${msg}`);
  });
}

// Interval untuk mencetak pesan setiap 100 detik
setInterval(printMessages, 100000);

// Memulai WppConnect dan bot
wppconnect.create()
  .then(start)
  .catch((error) => console.error('Error starting client:', error));
