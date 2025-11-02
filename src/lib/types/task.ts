export interface Task {
  id: string;
  start?: {
    date: Date;
    timezone?: string;
  };
  duration?: {
    amount: number;
    unit: "minute" | "day";
  };
  description: string;
  title: string;
}
