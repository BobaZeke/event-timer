import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
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

  it('should show the add form when showAddForm is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.startAddEvent();
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
      visible: true
    });
    expect(app.events.length).toBe(initialLength + 1);
  });

  it('should delete an event', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.events = [
      { title: 'A', date: new Date(), visible: true },
      { title: 'B', date: new Date(), visible: true }
    ];
    app.editIndex = 0;
    spyOn(window, 'confirm').and.returnValue(true);
    app.deleteEvent();
    expect(app.events.length).toBe(1);
    expect(app.events[0].title).toBe('B');
  });

  it('should cancel edit and reset form', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.startAddEvent();
    app.formEvent.title = 'Test';
    app.cancelEdit();
    expect(app.showEditForm).toBeFalse();
    expect(app.formEvent.title).toBe('');
  });
  
});