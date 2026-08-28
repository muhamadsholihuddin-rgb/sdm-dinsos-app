// Semua operasi baca/tulis data lewat Apps Script Web App yang di-deploy dari spreadsheet.
export async function callAppsScript(action, payload) {
  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.APPS_SCRIPT_TOKEN;

  if (!url || !token) {
    throw new Error("APPS_SCRIPT_URL / APPS_SCRIPT_TOKEN belum diatur di environment variables.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, action, payload: payload || {} }),
    // Apps Script kadang butuh redirect mengikuti domain script.google.com -> googleusercontent.com
    redirect: "follow",
    cache: "no-store",
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Respons Apps Script tidak valid: " + text.slice(0, 200));
  }

  if (data && data.error) {
    const err = new Error(data.error);
    err.isAppsScriptError = true;
    throw err;
  }

  return data;
}
