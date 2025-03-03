import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appStickyHeader]',
})
export class StickyHeaderDirective {
  private lastScrollTop = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      // Usuario baja el scroll, fijar el slider
      this.renderer.addClass(this.el.nativeElement, 'fixed-slider');
    } else if (scrollTop < this.lastScrollTop) {
      // Usuario sube el scroll, restaurar
      this.renderer.removeClass(this.el.nativeElement, 'fixed-slider');
    }

    this.lastScrollTop = scrollTop;
  }
}
