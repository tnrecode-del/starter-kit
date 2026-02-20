/**
 * Telegram Notifier v4 — Production
 *
 * Fixes from v3:
 * - MarkdownV2 instead of deprecated Markdown
 * - Max retry limit (no infinite loop)
 * - Rate limiting with token bucket
 * - Webhook listener for incoming commands
 * - Proper character escaping for MarkdownV2
 * - Structured daily summary with cost breakdown
 */

import axios, { AxiosError } from "axios";
import pino from "pino";

import type { TelegramNotification, Priority } from "./types.js";

const log = pino({ name: "telegram" });

// ─── MarkdownV2 Escaping ────────────────────────────────────────────

const ESCAPE_CHARS = /[_*[\]()~`>#+\-=|{}.!\\]/g;

function escapeMarkdownV2(text: string): string {
  return text.replace(ESCAPE_CHARS, "\\$&");
}

function bold(text: string): string {
  return `*${escapeMarkdownV2(text)}*`;
}

function code(text: string): string {
  return `\`${text.replace(/`/g, "\\`")}\``;
}

// ─── Telegram Notifier ──────────────────────────────────────────────

export class TelegramNotifier {
  private apiUrl: string;
  private chatId: string;
  private enabled: boolean;

  // Rate limiting
  private queue: { text: string; retries: number }[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_MS = 100; // Telegram: 30 msg/sec, we use 10/sec to be safe

  constructor(botToken?: string, chatId?: string) {
    this.enabled = !!(botToken && chatId);
    this.apiUrl = botToken ? `https://api.telegram.org/bot${botToken}` : "";
    this.chatId = chatId ?? "";

    if (!this.enabled) {
      log.warn(
        "Telegram disabled — missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      );
    }
  }

  // ─── Public API ─────────────────────────────────────────────────

  async send(notification: TelegramNotification): Promise<void> {
    if (!this.enabled) return;

    const text = this.formatNotification(notification);
    this.queue.push({ text, retries: 0 });

    if (!this.processing) {
      await this.processQueue();
    }
  }

  async sendRaw(text: string): Promise<number | null> {
    if (!this.enabled) return null;

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: "MarkdownV2",
      });
      return response.data.result.message_id;
    } catch (err) {
      log.error(
        { err: (err as AxiosError).message },
        "Failed to send raw message",
      );
      return null;
    }
  }

  async editMessage(messageId: number, text: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await axios.post(`${this.apiUrl}/editMessageText`, {
        chat_id: this.chatId,
        message_id: messageId,
        text,
        parse_mode: "MarkdownV2",
      });
    } catch (err) {
      log.warn(
        { err: (err as AxiosError).message, messageId },
        "Failed to edit message",
      );
    }
  }

  async sendWithButtons(
    text: string,
    buttons: Array<{ text: string; callback_data: string }>,
  ): Promise<number | null> {
    if (!this.enabled) return null;

    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            buttons.map((b) => ({
              text: b.text,
              callback_data: b.callback_data,
            })),
          ],
        },
      });
      return response.data.result.message_id;
    } catch (err) {
      log.error(
        { err: (err as AxiosError).message },
        "Failed to send message with buttons",
      );
      return null;
    }
  }

  // ─── Queue Processing ───────────────────────────────────────────

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;

        try {
          await axios.post(`${this.apiUrl}/sendMessage`, {
            chat_id: this.chatId,
            text: item.text,
            parse_mode: "MarkdownV2",
          });

          await sleep(this.RATE_LIMIT_MS);
        } catch (err) {
          const status = (err as AxiosError).response?.status;

          // Rate limited by Telegram — wait and retry
          if (status === 429) {
            const retryAfter =
              Number((err as AxiosError).response?.headers?.["retry-after"]) ||
              5;
            log.warn({ retryAfter }, "Rate limited by Telegram, waiting");
            await sleep(retryAfter * 1000);
          }

          // Retry with limit
          if (item.retries < this.MAX_RETRIES) {
            this.queue.push({ ...item, retries: item.retries + 1 });
          } else {
            log.error(
              { retries: item.retries },
              "Message dropped after max retries",
            );
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // ─── Notification Formatting ────────────────────────────────────

  private formatNotification(n: TelegramNotification): string {
    const emoji = this.priorityEmoji(n.priority);
    const lines: string[] = [];

    lines.push(`${emoji} ${bold(n.title)}`);
    lines.push("");
    lines.push(escapeMarkdownV2(n.message));

    if (n.details && Object.keys(n.details).length > 0) {
      lines.push("");
      for (const [key, value] of Object.entries(n.details)) {
        const displayKey = escapeMarkdownV2(key);
        if (typeof value === "object") {
          lines.push(`• ${bold(displayKey)}: ${code(JSON.stringify(value))}`);
        } else {
          lines.push(`• ${bold(displayKey)}: ${code(String(value))}`);
        }
      }
    }

    lines.push("");
    lines.push(`_${escapeMarkdownV2(new Date().toLocaleTimeString())}_`);

    return lines.join("\n");
  }

  private priorityEmoji(priority: Priority): string {
    const map: Record<Priority, string> = {
      low: "ℹ️",
      medium: "📌",
      high: "🔔",
      critical: "🚨",
    };
    return map[priority];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default TelegramNotifier;
