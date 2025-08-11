export interface EventModel {
  title: string;
  date: Date | string;
  countDirection: EventDirection;
  visible: boolean;
}

/* 
  - date in past  : count up  : how long since started (eg birthdays, anniversaries)
  - date in future: count down: how long until the event (eg holidays, vacations, retirement))
*/
export enum EventDirection {
  Up = 'Up',
  Down = 'Down'
}