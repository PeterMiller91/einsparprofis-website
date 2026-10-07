import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

async function sendToTelegram(leadData: {
  name: string;
  plz: string;
  tel: string;
  schaetzung?: string;
  src?: string;
  timestamp: string;
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      "Telegram credentials missing. Skipping Telegram notification. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables."
    );
    return null;
  }

  try {
    const message = `
🎯 <b>Neuer Lead!</b>

👤 <b>Name:</b> ${leadData.name}
📍 <b>PLZ:</b> ${leadData.plz}
📞 <b>Telefon:</b> ${leadData.tel}
💰 <b>Schätzung:</b> ${leadData.schaetzung || "Nicht angegeben"}
📊 <b>Quelle:</b> ${leadData.src || "Website"}
⏰ <b>Zeit:</b> ${new Date(leadData.timestamp).toLocaleString("de-DE")}
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Telegram notification error:", error);
    throw error;
  }
}

async function sendToGoogleSheets(leadData: {
  name: string;
  plz: string;
  tel: string;
  schaetzung?: string;
  src?: string;
  timestamp: string;
}) {
  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!credentialsJson || !sheetId) {
    console.warn(
      "Google Sheets credentials missing. Skipping Google Sheets. Set GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEETS_ID in environment variables."
    );
    return null;
  }

  try {
    const credentials = JSON.parse(credentialsJson);

    const doc = new GoogleSpreadsheet(sheetId, new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    }));

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      Name: leadData.name,
      PLZ: leadData.plz,
      Telefon: leadData.tel,
      Schätzung: leadData.schaetzung || "Nicht angegeben",
      Quelle: leadData.src || "Website",
      Zeitstempel: new Date(leadData.timestamp).toLocaleString("de-DE"),
    });

    console.log("Lead successfully added to Google Sheets");
    return true;
  } catch (error) {
    console.error("Google Sheets error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, plz, tel, schaetzung, src, consent } = body;

    // Validation
    if (!name || !plz || !tel || !consent) {
      return NextResponse.json(
        { error: "Pflichtfelder erforderlich" },
        { status: 400 }
      );
    }

    // PLZ validation: 5 digits, doesn't start with 0
    if (!/^[1-9]\d{4}$/.test(plz)) {
      return NextResponse.json(
        { error: "PLZ ungültig (5 Ziffern, erste Ziffer nicht 0)" },
        { status: 400 }
      );
    }

    // Phone validation: German format
    const digits = tel.replace(/\D/g, "");
    let isValidPhone = false;
    if (tel.startsWith("+49")) {
      isValidPhone = digits.length >= 11 && digits.length <= 13;
    } else if (tel.startsWith("0")) {
      isValidPhone = digits.length >= 10 && digits.length <= 11;
    } else {
      isValidPhone = digits.length >= 10 && digits.length <= 13;
    }

    if (!isValidPhone) {
      return NextResponse.json(
        { error: "Telefon ungültig (deutsche Nummer erforderlich)" },
        { status: 400 }
      );
    }

    // Name validation: at least 2 characters, letters only
    if (!/^[a-zA-ZäöüßÄÖÜ\s\-]{2,}$/.test(name.trim())) {
      return NextResponse.json(
        { error: "Name ungültig (mind. 2 Buchstaben)" },
        { status: 400 }
      );
    }

    const leadData = {
      name,
      plz,
      tel,
      schaetzung,
      src,
      timestamp: new Date().toISOString(),
    };

    console.log("New lead received:", leadData);

    try {
      await sendToTelegram(leadData);
      console.log("Lead successfully sent to Telegram");
    } catch (telegramError) {
      console.error("Failed to send to Telegram:", telegramError);
      // Lead is still received, but log the Telegram notification error
    }

    try {
      await sendToGoogleSheets(leadData);
      console.log("Lead successfully added to Google Sheets");
    } catch (sheetsError) {
      console.error("Failed to add to Google Sheets:", sheetsError);
      // Lead is still received, but log the Google Sheets error
    }

    return NextResponse.json(
      { success: true, message: "Lead erfolgreich gespeichert" },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Interner Server-Fehler" },
      { status: 500 }
    );
  }
}
