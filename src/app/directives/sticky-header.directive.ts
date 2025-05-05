import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  Inject,
  PLATFORM_ID,
  OnInit,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment.dev';

@Directive({
  selector: '[appStickyHeader]',
  standalone: true,
})
export class StickyHeaderDirective implements OnInit {
  private scrollThreshold = 500;
  private isBrowser: boolean;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Initializes directive and sets initial styles
  ngOnInit(): void {
    if (!this.isBrowser) return;
    if (!environment.production) {
      console.log('Sticky header directive applied');
    }
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
  }

  // Handles window scroll to toggle sticky header
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    const scrollTop = window.scrollY || this.document.documentElement.scrollTop;

    if (scrollTop > this.scrollThreshold) {
      this.renderer.addClass(this.el.nativeElement, 'fixed-slider');
      this.renderer.setStyle(this.el.nativeElement, 'position', 'fixed');
      this.renderer.setStyle(this.el.nativeElement, 'z-index', '1000');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'fixed-slider');
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }
  }
}
