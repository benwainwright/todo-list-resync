import { runSync } from "@core";
import { command, run, string } from "@drizzle-team/brocli";
import { GoogleCalendarClient } from "@events";
import { TodoistClient } from "@tasks";

const sync = command({
  name: "sync",
  options: {
    todoistToken: string().required(),
    googleApiKey: string().required(),
    calendarId: string().required(),
  },
  handler: async (opts) => {
    const google = new GoogleCalendarClient({
      calendarId: opts.calendarId,
      apiKey: opts.googleApiKey,
    });

    const todoist = new TodoistClient({
      token: opts.todoistToken,
    });

    try {
      await runSync({
        calendar: google,
        taskList: todoist,
      });
    } catch (error) {
      console.log(error);
    }
  },
});

await run([sync]);
