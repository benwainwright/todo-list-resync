import { calendar_v3 as googleCalender } from "@googleapis/calendar";
import type { CalendarApi, Event, EventEmitter } from "@types";

export class GoogleCalendarClient implements CalendarApi {
  private events: EventEmitter;
  public constructor(
    private config: {
      calendarId: string;
      apiKey: string;
      events: EventEmitter;
    },
  ) {
    this.events = config.events;
    this.events.emit("GoogleCalendarClientInitialised");
  }

  public async getEvents(): Promise<Event[]> {
    this.events.emit("GoogleCalendarEventsRequesting");
    const events = await this.getEventsHelper();
    this.events.emit("GoogleCalenderEventsRequested");
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
