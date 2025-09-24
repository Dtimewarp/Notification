import express from "express";
import { google } from "googleapis";
import fetch from "node-fetch";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ================== Переменные окружения ==================
const TOKEN = process.env.TG_TOKEN;
const CHANNEL_ID = process.env.TG_CHANNEL;
const SHEET_ID = process.env.SHEET_ID;
const SHEET_RANGE = process.env.SHEET_RANGE || "Аркуш1!A:E";
const KEY_FILE = path.resolve(process.env.KEY_FILE || "service-account.json");

// ================== Google Sheets ==================
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: "v4", auth });

async function getSheetData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
  });
  return res.data.values;
}

async function updateMarker(rowIndex) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Аркуш1!E${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [[true]] },
  });
}

// ================== Telegram ==================
async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Ошибка Telegram:", err);
    throw new Error("Ошибка отправки сообщения");
  }
}

// ================== Основная функция ==================
async function processNotifications() {
  const rows = await getSheetData();
  console.log("Rows from sheet:", rows);

  for (let i = 1; i < rows.length; i++) {
    const [date, event, message, ticket, marker] = rows[i];
    console.log(i, { date, event, message, ticket, marker }); // проверяем, что приходит

    if (
      marker === undefined ||
      marker === null ||
      marker === "" ||
      marker.toString().toLowerCase() === "false"
    ) {
      let text = `📅 <b>${date || ""}</b>\n📌 ${event || ""}\n💬 ${
        message || ""
      }`;
      if (ticket) text += `\n🎟️ ${ticket}`;
      await sendTelegramMessage(text);
      await updateMarker(i);
      console.log("Sending message:", text);
    }
  }
}

// ================== Endpoint ==================
app.post("/notify", async (req, res) => {
  try {
    await processNotifications();
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при отправке");
  }
});

// ================== Запуск сервера ==================
app.listen(3000, () => console.log("Backend http://localhost:3000"));
