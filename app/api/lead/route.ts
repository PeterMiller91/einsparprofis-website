import { NextRequest, NextResponse } from "next/server";

async function sendToAirtable(leadData: {
  name: string;
  plz: string;
  tel: string;
  schaetzung?: string;
  src?: string;
  timestamp: string;
}) {
  const airtableToken = process.env.AIRTABLE_API_TOKEN;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const airtableTableName = process.env.AIRTABLE_TABLE_NAME || "Leads";

  if (!airtableToken || !airtableBaseId) {
    console.warn(
      "Airtable credentials missing. Skipping Airtable sync. Set AIRTABLE_API_TOKEN and AIRTABLE_BASE_ID in environment variables."
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Name: leadData.name,
                PLZ: leadData.plz,
                Telefon: leadData.tel,
                Schätzung: leadData.schaetzung || null,
                Quelle: leadData.src || "Website",
                "Datum/Uhrzeit": leadData.timestamp,
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Airtable sync error:", error);
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
      await sendToAirtable(leadData);
      console.log("Lead successfully sent to Airtable");
    } catch (airtableError) {
      console.error("Failed to send to Airtable:", airtableError);
      // Lead is still saved, but log the Airtable error
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
