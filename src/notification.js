// notification.js
const TOKEN = import.meta.env.VITE_TOKEN;
const CHANNEL_ID = import.meta.env.VITE_CHANNEL_ID;
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_RANGE = import.meta.env.VITE_SHEET_RANGE;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY; // нужен публичный API key

// =============== Google Sheets ===============
async function getSheetData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    SHEET_RANGE
  )}?key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Ошибка запроса к Google Sheets");
  const data = await res.json();
  return data.values; // массив строк
}

// =============== Telegram ===============
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

// =============== Основная логика ===============
export async function notifyFromSheet() {
  try {
    const rows = await getSheetData();

    // Первая строка — заголовки, поэтому начинаем с индекса 1
    for (let i = 1; i < rows.length; i++) {
      const [date, event, message, ticket, marker] = rows[i];

      // marker === "TRUE" / "☑️" / пусто (в зависимости от экспорта)
      if (!marker) {
        const text =
          `📅 <b>${date || ""}</b>\n` +
          `📌 ${event || ""}\n` +
          `💬 ${message || ""}\n` +
          (ticket ? `🔗 <a href="${ticket}">Ссылка</a>` : "");

        await sendTelegramMessage(text);
      }
    }

    alert("Уведомления отправлены!");
  } catch (err) {
    console.error(err);
    alert("Ошибка: " + err.message);
  }
}
