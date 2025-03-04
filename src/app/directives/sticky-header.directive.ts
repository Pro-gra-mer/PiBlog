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

@Directive({
  selector: '[appStickyHeader]',
  standalone: true,
})
export class StickyHeaderDirective implements OnInit {
  private scrollThreshold = 650; // ✅ Retrasar el cambio con más scroll
  private isBrowser: boolean;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    const scrollTop = window.scrollY || this.document.documentElement.scrollTop;

    if (scrollTop > this.scrollThreshold) {
      this.renderer.addClass(this.el.nativeElement, 'fixed-slider');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'fixed-slider');
    }
  }
}
