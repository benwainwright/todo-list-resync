import { runSync, EventBus } from "@core";
import { command, run, string } from "@drizzle-team/brocli";

import { GoogleCalendarClient } from "@google-calendar";
import { MaxLabelTasks } from "@rules";
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
    const google = new GoogleCalendarClient({
      calendarId: opts.calendarId,
      apiKey: opts.googleApiKey,
      events,
    });

    const todoist = new TodoistClient({
      token: opts.todoistToken,
      events,
    });

    const noMoreThanOneLargeTask = new MaxLabelTasks(1, "large");

    await runSync({
      calendar: google,
      taskList: todoist,
      eventEmitter: events,
      rules: [noMoreThanOneLargeTask],
    });
  },
});

await run([sync]);
