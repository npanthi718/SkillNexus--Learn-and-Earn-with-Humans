import { Notification } from "../models/Notification.js";

export async function createNotification({ userId, type, title, body, link, relatedId, relatedModel }) {
  try {
    await Notification.create({
      userId,
      type,
      title,
      body: body || "",
      link: link || null,
      relatedId: relatedId || null,
      relatedModel: relatedModel || null
    });
  } catch (err) {
    console.error("Create notification error:", err.message);
  }
}
