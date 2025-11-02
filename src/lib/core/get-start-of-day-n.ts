import { DateTime } from "luxon";

export const getStartOfDayN = (offset: number) => {
  return DateTime.now().startOf("day").plus({
    days: offset,
  });
};
