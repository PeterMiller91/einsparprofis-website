import { NextRequest, NextResponse } from "next/server";

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

    if (!/^\d{5}$/.test(plz)) {
      return NextResponse.json(
        { error: "PLZ ungültig" },
        { status: 400 }
      );
    }

    if (!/^\d{6,}/.test(tel.replace(/\D/g, ""))) {
      return NextResponse.json(
        { error: "Telefon ungültig" },
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
