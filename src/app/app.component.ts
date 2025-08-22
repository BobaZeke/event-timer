import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventDirection, EventModel } from './models/event.model';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef } from '@angular/core';
import { timer } from 'rxjs'; 

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, DatePipe, FormsModule, DragDropModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  /* Application title */
  public title: string = 'Event Tracker';
  /* List of events */
  public events: EventModel[] = [];
  /* Key for local storage */
  private storageKey: string = 'event-tracker-events';
  /* initial timer to sync with 10 past midnight */
  private timerId: any;
  /* timer to update every 24 hours after initial 'sync' timer */
  private hourlyIntervalId: any;
  /* list of 'date differences' for UI Display */
  public eventDifferences: { [key: number]: string } = {};
  /* add/edit form model */
  public formEvent: EventModel = {
    title: '',
    date: new Date(),
    visible: true
  };
  /* index of event being edited, null if adding new */
  public editIndex: number | null = null;
  /* bool to show/hide the add/edit form */
  public showEditForm: boolean = false;

  //#region Initialization and Cleanup

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    try {
      this.loadEvents();
      this.updateEventDifferences();
      this.startTimer();
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.docEventHandler);
  }

  //#endregion
  //#region Timer Logic

  /**
   * Start the timer to update event differences at 10 past midnight and every 24 hours thereafter
   * This ensures the event differences are always up-to-date
   */
  private startTimer() {
    // Stop any existing timers before starting a new one
    this.stopTimer();
    // perform all calculations using the same 'now' date
    const now = new Date();

    //  determine how long it is until midnight...
    //    > midnight starts the day @ 00:00, so the next midnight will be at the start of tomorrow :)
    var nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    var msUntilMidnight = nextMidnight.getTime() - now.getTime(); // get the millisecond difference (ms between now and midnight)
    //  adjust time to be 10 minutes past midnight, to avoid edge cases
    msUntilMidnight += 10 * 60 * 1000; // 10 minutes in ms
    
    // set up the timers...
    //   > First, set a timer to update tonight @ 10 minutes past midnight
    this.timerId = timer(msUntilMidnight).subscribe(() => {
      this.updateEventDifferences();
      // > After that, set a timer to update every 24 hours (each day at 10 past midnight)
      this.hourlyIntervalId = timer(24 * 60 * 60 * 1000).subscribe(() => {
        this.updateEventDifferences();
      });
    });
  }

  /**
   * Stop the timer and clear any existing intervals
   * This is called on component destruction to prevent memory leaks
   */
  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.hourlyIntervalId) {
      clearInterval(this.hourlyIntervalId);
      this.hourlyIntervalId = null;
    }
  }

  //#endregion
  //#region UI Display Logic

  /**
   * Update the eventDifferences list with the current differences for each event (days until/ago)
   * This is called on initialization and every 24 hours thereafter
   */
  private updateEventDifferences() {
    const now = new Date();
    // console.log('Updating event differences at', now.toLocaleString());
    this.eventDifferences = {};

    this.events.forEach((event, idx) => {
      this.eventDifferences[idx] = this.formatDifference(now, new Date(event.date));
      // console.log(`Event: ${event.title}, Date: ${new Date(event.date).toLocaleDateString()}, Difference: ${this.eventDifferences[idx]}`);
    });
    
    this.cdr.detectChanges(); // forces UI update
  }

  /**
   * Format the difference between now and the event date into a human-readable string
   * @param now Current date
   * @param eventDate The event date to compare against
   * @returns Formatted string showing the difference
   */
  private formatDifference(now: Date, eventDate: Date): string {
    let fromDate: Date, toDate: Date;
    let suffix: string;

    // Determine 'count direction' based on event date : past = counting Up (days since then), future = counting Down (days until then))
    let direction = (eventDate > now) ? EventDirection.Future : EventDirection.Past;
    if (direction === EventDirection.Future) {
      fromDate = now;
      toDate = eventDate;
      suffix = 'left';
    } else {
      fromDate = eventDate;
      toDate = now;
      suffix = 'ago';
    }

    var { years, months, days } = this.calculateDateDifference(fromDate, toDate);

    // format output
    let result = this.formatDateOutput(years, months, days, suffix);
    //  append 'next occurrence' if counting Up (past dates)
    result += this.formatNextOccurrence(direction, now, eventDate);

    return result;
  }

  /**
   * For 'past' dates, calculate the Next occurrence (anniversary/birthday)
   * @param direction The direction of the event (Past or Future)
   * @param now current date
   * @param eventDate The event date to compare against
   * @returns  Formatted string showing how long until the next occurrence, or empty string if not applicable
   */
  private formatNextOccurrence(direction: EventDirection, now: Date, eventDate: Date): string {
    if (direction === EventDirection.Past) {
      // Determine the next occurrence of the event date (either later this year or next year))
      //    First, check if the next occurrence is later this year
      let next = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      if (next < now) {
        //  Else, the next occurrence is next year
        next.setFullYear(next.getFullYear() + 1);
      }
      // Special case for Feb 29
      if (eventDate.getMonth() === 1 && eventDate.getDate() === 29) {
        while (!this.isLeapYear(next.getFullYear())) {
          next.setFullYear(next.getFullYear() + 1);
        }
      }

      const { years: nYears, months: nMonths, days: nDays } = this.calculateDateDifference(now, next);

      // format output
      let monthsDaysStr = '';
      if (nMonths > 0) monthsDaysStr += `${nMonths} month${nMonths !== 1 ? 's' : ''}`;
      if (nDays > 0) {
        if (monthsDaysStr) monthsDaysStr += ' ';
        monthsDaysStr += `${nDays} day${nDays !== 1 ? 's' : ''}`;
      }
      
      if (!monthsDaysStr) return '';    //  today, so display nothing
      return ` | next: ${monthsDaysStr}`;
    }
    return '';
  }

  /**
   * Calculate the exact difference between two dates, and return the amount of years, months, and days difference
   * @param fromDate 
   * @param toDate 
   * @returns 
   */
  private calculateDateDifference(fromDate: Date, toDate: Date): { years: number, months: number, days: number } {
    let nYears = toDate.getFullYear() - fromDate.getFullYear();
    let nMonths = toDate.getMonth() - fromDate.getMonth();
    let nDays = toDate.getDate() - fromDate.getDate();

    // if we got a negative day result, then back up to the previous month
    if (nDays < 0) {
      nMonths -= 1;
      const prevMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
      nDays += prevMonth.getDate();
    }

    // if we got a negative month result, then back up to the previous year
    if (nMonths < 0) {
      nYears -= 1;
      nMonths += 12;
    }

    return { years: nYears, months: nMonths, days: nDays };
  }

  /**
   * Check if a given year is a leap year
   * @param year The year to check
   * @returns True if the year is a leap year, false otherwise
   */
  private isLeapYear(year: number): boolean {
    // A year is a leap year if it is divisible by 4, except for end-of-century years, which must be divisible by 400
    // Example: 2000 is a leap year, but 1900 is not
    return ( 
      year % 4 === 0 
      && 
      (
        year % 100 !== 0 
        || 
        year % 400 === 0
      )
    );
  }

  /**
   * Format the date difference output into a human-readable string
   * @param years Number of years difference
   * @param months Number of months difference
   * @param days Number of days difference
   * @returns Formatted string showing the difference 
   */
  private formatDateOutput(years: number, months: number, days: number, suffix: string): string {
        // shortcut for today :)
    if (days + months + years == 0) {
      return `<b>< < < < < Today > > > > ></b>`;
    }

    let parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 days' + ` ${suffix}`;
  }


  public formatDiffHtml(diff: string): string {
    // This regex will bold numbers (including negative numbers)
    return diff.replace(/(\d+)/g, '<b>$1</b>');
  }

  //#endregion
  //#region Document Events

  /**
   * Handles reordering of events in the list via drag-and-drop
   * @param event CdkDragDrop event from drag-and-drop action
   */
  public drop(event: CdkDragDrop<EventModel[]>) {
    moveItemInArray(this.events, event.previousIndex, event.currentIndex);
    this.saveEvents(); // Save new order if you persist events
    this.updateEventDifferences();
  }

  /**
   * Handles document events (to update event differences)
   */
  private docEventHandler = () => {
    if (!document.hidden) {
      // console.log('Visibility change detected:', document.visibilityState);
      // If the document is visible, update event differences and restart the timer
      this.updateEventDifferences();
    }
  };

  //#endregion
  //#region CRUD Operations

  /**
   * Handles form submission for adding or editing an event
   * Validates and processes the form data, then updates the events list accordingly
   */
  public onSubmit() {
    // Convert date string to Date object if needed
    if (typeof this.formEvent.date === 'string') {
      // Parse "YYYY-MM-DD" as local date (omit time)
      const [year, month, day] = this.formEvent.date.split('-').map(Number);
      this.formEvent.date = new Date(year, month - 1, day);
    }

    if (this.editIndex === null) {
      this.addEvent({ ...this.formEvent });
    } else {
      this.events[this.editIndex] = { ...this.formEvent };
      this.saveEvents();
      this.editIndex = null;
    }
    this.cancelEdit();
    this.updateEventDifferences();
  }

  /**
   * Prepares the form for editing an existing event by populating it with the event's data
   * @param index Index of the event to edit
   */
  public startEditEvent(index: number) {
    const event = this.events[index];
    let dateString: string;
    if (typeof event.date === 'string') {
      // If already in yyyy-MM-dd format, use as is
      dateString = event.date.length === 10 ? event.date : event.date.substring(0, 10);
    } else {
      // Convert Date object to yyyy-MM-dd
      dateString = `${event.date.getFullYear()}-${(event.date.getMonth() + 1).toString().padStart(2, '0')}-${event.date.getDate().toString().padStart(2, '0')}`;
    }
    this.formEvent = {
      ...event,
      date: dateString
    };
    this.editIndex = index;
    this.showEditForm = true; // Show the edit form
  }

  /**
   * shows the add/edit form in 'add' mode
   */
  public startAddEvent() {
    this.editIndex = null;
    this.formEvent = {
      title: '',
      date: new Date(),
      visible: true
    };
    this.showEditForm = true;
  }

  /**
   * Cancels the edit operation and resets the form
   */
  public cancelEdit() {
    this.showEditForm = false; // Hide the edit form
    this.formEvent = {
      title: '',
      date: '',
      visible: true
    };
    this.editIndex = null;
  }

  /**
   * Deletes the event currently being edited (after confirmation)
   */
  public deleteEvent() {
    if (this.editIndex !== null && this.editIndex >= 0 && this.editIndex < this.events.length) {
      if (confirm('Are you sure you want to delete this event?')) {
        this.events.splice(this.editIndex, 1);
        this.saveEvents();
        this.updateEventDifferences();
        this.cancelEdit();
      }
    }
  }

  /**
   * Adds the new event to the list and saves to local storage.
   * @param event EventModel to add to the list
   */
  public addEvent(event: EventModel) {
    this.events.push(event);
    this.saveEvents();
  }

  /**
   * Saves the current list of events to local storage, after validating them.  
   * Invalid events (missing title, date, or visible flag) are filtered out before saving.
   */
  private saveEvents() {
    // Validate events before saving
    this.events = this.events.filter(event =>
      event.title &&
      event.date &&
      typeof event.visible === 'boolean'
    );
    // save events to local storage
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
  }

  /**
   * Loads the list of events from local storage.
   * If no events are found, a default event is added.
   */
  private loadEvents() {
    //  load events from local storage
    const eventJson = localStorage.getItem(this.storageKey);
    this.events = eventJson ? JSON.parse(eventJson) : [];

    if (this.events.length === 0) {
      // Add a default event if no events are found
      this.events.push({
        title: 'Started using Event Tracker',
        date: new Date(),
        visible: true
      });
      this.saveEvents();
    }
  }

  //#endregion

}