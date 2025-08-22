export interface EventModel {
  title: string;
  date: Date | string;
  visible: boolean;
}

/* 
  - date in past  : count up  : how long since started (eg birthdays, anniversaries)
  - date in future: count down: how long until the event (eg holidays, vacations, retirement))
*/
export enum EventDirection {
  /**
   * Counting Up: used for past events (e.g., birthdays, anniversaries)
   * Counts how long since the event occurred.
   */
  Past = 'Up',
  /**
   * Counting Down: used for future events (e.g., holidays, vacations, retirement)
   * Counts how long until the event occurs.
   */
  Future = 'Down'
}