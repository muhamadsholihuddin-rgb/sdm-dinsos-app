import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sdm_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum diatur di environment variables.");
  return secret;
}

function sign(payloadBase64) {
  return crypto.createHmac("sha256", getSecret()).update(payloadBase64).digest("hex");
}

export function createSessionToken(data) {
  const payloadBase64 = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payloadBase64, signature] = token.split(".");
  const expected = sign(payloadBase64);
  if (signature !== expected) return null;
  try {
    return JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function setSessionCookie(data) {
  const token = createSessionToken(data);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
