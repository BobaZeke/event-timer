import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { EventDirection } from './models/event.model';
import 'zone.js';

describe('AppComponent', () => {

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, FormsModule, DragDropModule, CommonModule]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Event Tracker');
  });

  it('should show the add form when showAddForm is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.showAddForm();
    fixture.detectChanges();
    expect(app.showEditForm).toBeTrue();
    const form = fixture.debugElement.query(By.css('.add-edit-form'));
    expect(form).toBeTruthy();
  });

  it('should add an event', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const initialLength = app.events.length;
    app.addEvent({
      title: 'Test Event',
      date: new Date(),
      countDirection: EventDirection.Up,
      visible: true
    });
    expect(app.events.length).toBe(initialLength + 1);
  });

  it('should delete an event', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.events = [
      { title: 'A', date: new Date(), countDirection: EventDirection.Up, visible: true },
      { title: 'B', date: new Date(), countDirection: EventDirection.Up, visible: true }
    ];
    app.editIndex = 0;
    spyOn(window, 'confirm').and.returnValue(true);
    app.deleteItem();
    expect(app.events.length).toBe(1);
    expect(app.events[0].title).toBe('B');
  });

  it('should cancel edit and reset form', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.showAddForm();
    app.formEvent.title = 'Test';
    app.cancelEdit();
    expect(app.showEditForm).toBeFalse();
    expect(app.formEvent.title).toBe('');
  });
  
});