import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Add this import
import { EventDirection, EventModel } from './models/event.model';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, DatePipe, FormsModule, DragDropModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  public title: string = 'Event Tracker';
  public events: EventModel[] = [];

  private storageKey: string = 'event-tracker-events';

  private timerId: any;
  private hourlyIntervalId: any;
  private lastUpdateDate: string | null = null;

  public eventDifferences: { [key: number]: string } = {};

  public formEvent: EventModel = {
    title: '',
    date: new Date(),
    countDirection: EventDirection.Up,
    visible: true
  };
  public editIndex: number | null = null;
  public eventDirection = EventDirection;

  public showEditForm: boolean = false; // Control visibility of the edit form

  // TODO
  // Add a way to filter events by date or title
  // Add a way to sort events by date or title


  ngOnInit() {
    this.loadSavedEvents();

    this.updateEventDifferences();
    this.startTimer();

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy() {
    this.stopTimer();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }

  public drop(event: CdkDragDrop<EventModel[]>) {
    console.log('Drop event:', event);
    moveItemInArray(this.events, event.previousIndex, event.currentIndex);
    this.saveEvents(); // Save new order if you persist events
    this.updateEventDifferences();
  }

  private visibilityHandler = () => {
    if (document.hidden) {
      this.stopTimer();
    } else {
      this.updateEventDifferences();
      this.startTimer();
    }
  };

  private startTimer() {
    this.stopTimer();

    // Calculate ms until the next hour
    const now = new Date();
    const msUntilNextHour =
      (60 - now.getMinutes()) * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();

    // First update at the top of the next hour
    this.timerId = setTimeout(() => {
      this.checkAndUpdate();
      // Then update every hour
      this.hourlyIntervalId = setInterval(() => this.checkAndUpdate(), 60 * 60 * 1000);
    }, msUntilNextHour);
  }

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

  private checkAndUpdate() {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    if (this.lastUpdateDate !== todayStr) {
      this.lastUpdateDate = todayStr;
      this.updateEventDifferences();
    } else {
      // Still update hourly for hour-based events
      this.updateEventDifferences();
    }
  }

  private updateEventDifferences() {
    const now = new Date();
    this.eventDifferences = {};
    this.events.forEach((event, idx) => {
      this.eventDifferences[idx] = this.formatDifference(now, new Date(event.date), event.countDirection);
    });
    // Update lastUpdateDate here as well
    this.lastUpdateDate = now.toISOString().substring(0, 10);
  }

  private formatDifference(now: Date, eventDate: Date, direction: EventDirection): string {
    let fromDate: Date, toDate: Date;
    let suffix: string;

    if (direction === EventDirection.Down) {
      fromDate = now;
      toDate = eventDate;
      suffix = 'left';
    } else {
      fromDate = eventDate;
      toDate = now;
      suffix = 'ago';
    }

    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();
    let days = toDate.getDate() - fromDate.getDate();

    if (days < 0) {
      months -= 1;
      // Get days in previous month
      const prevMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    let result = this.formatDateOutput(years, months, days) + ` ${suffix}`;

    // Next occurrence for Up direction (anniversary/birthday)
    if (direction === EventDirection.Up) {
      let next = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      if (next < now) {
        next.setFullYear(next.getFullYear() + 1);
      }
      // Special case for Feb 29
      if (eventDate.getMonth() === 1 && eventDate.getDate() === 29) {
        while (!this.isLeapYear(next.getFullYear())) {
          next.setFullYear(next.getFullYear() + 1);
        }
      }
      // Calculate months/days until next
      let nYears = next.getFullYear() - now.getFullYear();
      let nMonths = next.getMonth() - now.getMonth();
      let nDays = next.getDate() - now.getDate();
      if (nDays < 0) {
        nMonths -= 1;
        const prevMonth = new Date(next.getFullYear(), next.getMonth(), 0);
        nDays += prevMonth.getDate();
      }
      if (nMonths < 0) {
        nYears -= 1;
        nMonths += 12;
      }
      let monthsDaysStr = '';
      if (nMonths > 0) monthsDaysStr += `${nMonths} month${nMonths !== 1 ? 's' : ''}`;
      if (nDays > 0) {
        if (monthsDaysStr) monthsDaysStr += ' ';
        monthsDaysStr += `${nDays} day${nDays !== 1 ? 's' : ''}`;
      }
      if (!monthsDaysStr) monthsDaysStr = 'Today';
      result += ` | next: ${monthsDaysStr}`;
    }

    return result;
  }

  private formatDateOutput(years: number, months: number, days: number): string {
    let parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : '0 days';
  }
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
  }

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

  public editEvent(index: number) {
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

  public showAddForm() {
    this.editIndex = null;
    this.formEvent = {
      title: '',
      date: new Date(),
      countDirection: EventDirection.Up,
      visible: true
    };
    this.showEditForm = true;
  }

  public deleteItem() {
    if (this.editIndex !== null && this.editIndex >= 0 && this.editIndex < this.events.length) {
      if (confirm('Are you sure you want to delete this event?')) {
        this.events.splice(this.editIndex, 1);
        this.saveEvents();
        this.updateEventDifferences();
        this.cancelEdit();
      }
    }
  }

  public cancelEdit() {
    this.showEditForm = false; // Hide the edit form
    this.formEvent = {
      title: '',
      date: '',   //new Date(),
      countDirection: EventDirection.Up,
      visible: true
    };
    this.editIndex = null;
  }

  // need to create a component for displaying an event, then use a loop in html 
  public addEvent(event: EventModel) {
    this.events.push(event);
    this.saveEvents();
  }

  public removeEvent(event: EventModel) {
    this.events = this.events.filter(e => e !== event);
    this.saveEvents();
  }

  private saveEvents() {
    // Validate events before saving
    this.events = this.events.filter(event =>
      event.title &&
      event.date &&
      event.countDirection &&
      typeof event.visible === 'boolean'
    );
    // save events to local storage
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
  }

  private loadSavedEvents() {
    //  load events from local storage
    const eventJson = localStorage.getItem(this.storageKey);
    this.events = eventJson ? JSON.parse(eventJson) : [];

    if (this.events.length === 0) {
      // Add a default event if no events are found
      this.events.push({
        title: 'Started using Event Tracker',
        date: new Date(),
        countDirection: EventDirection.Up,  // date is in the past, so count up (how long since started))
        visible: true
      });
      this.saveEvents();
    }
  }

  public formatDiffHtml(diff: string): string {
    // This regex will bold numbers (including negative numbers)
    return diff.replace(/(\d+)/g, '<b>$1</b>');
  }

}