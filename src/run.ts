import { runSync, EventBus } from "@core";
import { command, run, string } from "@drizzle-team/brocli";

import { GoogleCalendarClient } from "@google-calendar";
import { TodoistClient } from "@todoist";

const sync = command({
  name: "sync",
  options: {
    todoistToken: string().required(),
    googleApiKey: string().required(),
    calendarId: string().required(),
  },
  handler: async (opts) => {
    const events = new EventBus();

    events.onAll((data) => {
      console.log(data);
    });

    const google = new GoogleCalendarClient({
      calendarId: opts.calendarId,
      apiKey: opts.googleApiKey,
      events,
    });

    const todoist = new TodoistClient({
      token: opts.todoistToken,
      events,
    });

    try {
      await runSync({
        calendar: google,
        taskList: todoist,
        eventEmitter: events,
      });
    } catch (error) {
      console.log(error);
    }
  },
});

await run([sync]);
