const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const ZAPI_URL = "https://api.z-api.io/INSTANCE_ID";
const ZAPI_TOKEN = "YOUR_TOKEN";

const clientes = {};

const menuPrincipal = {
  "1": "📱 Nosso app é simples e prático! Acesse aqui: https://bmotech.com.br/app\nSe quiser ajuda para instalar, me avise.",
  "2": "💸 Nossa chave Pix é: *pix@bmotech.com.br*\n\n📷 Envie o comprovante aqui mesmo. Segue também o QR Code:",
  "3": "🔁 Para renovar sua licença, envie seu nome completo e a data do último pagamento. Vamos verificar.",
  "4": "📺 Para sua TV, temos diversas opções:\n1️⃣ Android TV\n2️⃣ Fire Stick\n3️⃣ TV Box\n\nResponda com o número da opção para mais detalhes.",
  "5": "🚫 Se não consegue acessar, verifique sua internet e reinicie o app. Se ainda não funcionar, me diga o que aparece na tela.",
  "6": "🧑‍💬 Certo! Me diga com o que posso te ajudar e vou encaminhar para o suporte adequado."
};

const submenuTV = {
  "1": "📲 Android TV: baixe o app pela Play Store. Use seu código de ativação.",
  "2": "🔥 Fire Stick: na lupa, pesquise 'BmoTV' e instale. Depois insira seu login.",
  "3": "📦 TV Box: baixe o APK neste link: https://bmotech.com.br/apk"
};

app.post("/webhook", async (req, res) => {
  if (!req.body || !req.body.message || !req.body.message.body || !req.body.message.from) {
    return res.sendStatus(200);
  }

  const msg = req.body.message.body.trim();
  const number = req.body.message.from;
  const lowerMsg = msg.toLowerCase();

  if (!clientes[number]) {
    clientes[number] = {
      nome: null,
      ultimaInteracao: null
    };
  }

  if (lowerMsg === "menu") {
    await sendMenu(number);
    return res.sendStatus(200);
  }

  if (["oi", "olá", "bom dia", "boa tarde", "boa noite"].includes(lowerMsg)) {
    await sendMessage(number, "👋 Olá! Seja bem-vindo ao atendimento da *Bmo Suporte*.");
    await sendMenu(number);
    return res.sendStatus(200);
  }

  if (menuPrincipal[msg]) {
    clientes[number].ultimaInteracao = msg;
    await sendMessage(number, menuPrincipal[msg]);

    if (msg === "2") {
      await sendImage(number, "https://bmotech.com.br/qrcodepix.png", "💳 Aqui está o QR Code para pagamento.");
    }

    return res.sendStatus(200);
  }

  if (clientes[number].ultimaInteracao === "4" && submenuTV[msg]) {
    await sendMessage(number, submenuTV[msg]);
    return res.sendStatus(200);
  }

  await sendMessage(number, "❓ Não entendi sua mensagem. Digite apenas o número da opção desejada ou envie *menu* para ver as opções novamente.");
  res.sendStatus(200);
});

async function sendMessage(to, message) {
  try {
    await axios.post(`${ZAPI_URL}/send-message`, {
      phone: to,
      message: message
    }, {
      headers: {
        "Content-Type": "application/json",
        "apikey": ZAPI_TOKEN
      }
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.response?.data || error.message);
  }
}

async function sendImage(to, imageUrl, caption = "") {
  try {
    await axios.post(`${ZAPI_URL}/send-image`, {
      phone: to,
      image: imageUrl,
      caption: caption
    }, {
      headers: {
        "Content-Type": "application/json",
        "apikey": ZAPI_TOKEN
      }
    });
  } catch (error) {
    console.error("Erro ao enviar imagem:", error.response?.data || error.message);
  }
}

async function sendMenu(number) {
  const textoMenu = `\nEscolha uma das opções abaixo:\n\n` +
    `1️⃣ Quero conhecer o app\n` +
    `2️⃣ Chave Pix para pagamento\n` +
    `3️⃣ Renovar licença de app\n` +
    `4️⃣ Opções de app para minha TV\n` +
    `5️⃣ Não consigo acessar\n` +
    `6️⃣ Ajuda com outro assunto\n\n` +
    `*Digite o número da opção desejada ou envie "menu" a qualquer momento.*`;

  await sendMessage(number, textoMenu);
}

app.listen(3000, () => {
  console.log("🤖 Chatbot Bmo Suporte rodando em http://localhost:3000");
});