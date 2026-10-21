"use client";

/** One calendar event: a whole day ("2027-03-12") or a time slot in the player's own time zone ("2026-10-22T12:30"). */
export type CalEvent = { id: string; start: string; minutes?: number; title: string; url: string };

const pad = (n: number) => String(n).padStart(2, "0");
const ics = (d: Date, withTime: boolean) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` + (withTime ? `T${pad(d.getHours())}${pad(d.getMinutes())}00` : "");

/** An .ics file (Apple, Google, Outlook) with a reminder: 12 h before a whole day, 10 min before a time slot. */
export function calendarFile(events: CalEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = events.flatMap((e) => {
    const timed = e.start.includes("T");
    const [y, m, d, h = 0, min = 0] = e.start.split(/[-T:]/).map(Number);
    const start = new Date(y, m - 1, d, h, min);
    const end = timed ? new Date(start.getTime() + (e.minutes ?? 10) * 60_000) : new Date(y, m - 1, d + 1);
    return [
      "BEGIN:VEVENT",
      `UID:polis-${e.id}-${ics(start, timed)}@polis-2027`,
      `DTSTAMP:${stamp}`,
      timed ? `DTSTART:${ics(start, true)}` : `DTSTART;VALUE=DATE:${ics(start, false)}`,
      timed ? `DTEND:${ics(end, true)}` : `DTEND;VALUE=DATE:${ics(end, false)}`,
      `SUMMARY:${e.title}`,
      `DESCRIPTION:${e.url}`,
      `URL:${e.url}`,
      "BEGIN:VALARM",
      `TRIGGER:${timed ? "-PT10M" : "-PT12H"}`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${e.title}`,
      "END:VALARM",
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//polis//presidentielle-2027//FR", "CALSCALE:GREGORIAN", ...lines, "END:VCALENDAR"].join("\r\n");
}

/** Hands the .ics file to the phone, which offers to add it to the calendar. */
export function downloadCalendar(fileName: string, events: CalEvent[]) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([calendarFile(events)], { type: "text/calendar;charset=utf-8" }));
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
