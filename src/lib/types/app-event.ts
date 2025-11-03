export interface AppEvent<T> {
  data: T;
  message: string | ((data: T) => string);
}
