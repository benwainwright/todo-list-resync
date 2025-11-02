import { calendar_v3 as googleCalender } from "@googleapis/calendar";
import type { CalendarApi, Event } from "@types";

export class GoogleCalendarClient implements CalendarApi {
  public constructor(
    private config: {
      calendarId: string;
      apiKey: string;
    },
  ) {}

  public async getEvents(): Promise<Event[]> {
    console.log("Downloading events from google calendar");
    const events = await this.getEventsHelper();
    console.log("Finished downloading events from google calendar");
    return events;
  }

  private async getEventsHelper(
    previousNextPageToken?: string,
  ): Promise<Event[]> {
    const calendarApi = new googleCalender.Calendar({
      apiVersion: "v3",
      auth: this.config.apiKey,
    });

    const now = new Date().toISOString();

    const {
      data: { nextPageToken, items: events },
    } = await calendarApi.events.list({
      singleEvents: true,
      timeMin: now,
      orderBy: "startTime",
      calendarId: this.config.calendarId,
      pageToken: previousNextPageToken,
    });

    if (!nextPageToken) {
      return this.normaliseGoogleEvents(events) ?? [];
    }

    return [
      ...(this.normaliseGoogleEvents(events) ?? []),
      ...(await this.getEventsHelper(nextPageToken)),
    ];
  }

  private normaliseGoogleEvents(events?: googleCalender.Schema$Event[]) {
    return events?.map((event) => ({
      start: event.start?.dateTime ? new Date(event.start.dateTime) : undefined,
      end: event.end?.dateTime ? new Date(event.end.dateTime) : undefined,
      title: event.summary === null ? undefined : event.summary,
      id: event.id === null ? undefined : event.id,
    }));
  }
}
