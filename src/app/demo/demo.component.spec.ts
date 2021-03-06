import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DemoComponent } from './demo.component';
import { routes } from '../app.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  RouterTestingModule
} from '@angular/router/testing';
import { NgJsonSchema } from 'ng-jsonschema';

describe('DemoComponent', () => {
  let component: DemoComponent;
  let fixture: ComponentFixture<DemoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        NgJsonSchema,
        NgJsonSchema.forRoot(),
        RouterTestingModule.withRoutes(routes)
      ],
      declarations: [
        DemoComponent
      ],
    }).compileComponents();
  }));

  it('should be created', () => {
    fixture = TestBed.createComponent(DemoComponent);
    const app = fixture.debugElement.componentInstance;
    // expect(app).toBeTruthy();
    // component = fixture.componentInstance;
    // fixture.detectChanges();
    // expect(component).toBeTruthy();
  });
});
