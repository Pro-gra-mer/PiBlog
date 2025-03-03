import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
})
export class SliderComponent implements AfterViewInit {
  @ViewChild('swiperContainer') swiperContainer!: ElementRef;
  @ViewChild('sliderWrapper') sliderWrapper!: ElementRef; // Elemento principal del slider
  private navbarHeight = 0; // Almacena la altura de la navbar
  private offsetTop = 0; // Posición inicial del slider

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngAfterViewInit(): void {
    // Inicializar Swiper
    this.initSwiper();

    // Obtener la altura de la navbar
    const navbar = this.document.querySelector('nav'); // Asegúrate de que la navbar tenga la etiqueta <nav>
    this.navbarHeight = navbar ? navbar.clientHeight : 60; // Usa 60px como valor por defecto si no encuentra la navbar

    // Obtener la posición inicial del slider y ajustar con la navbar
    this.offsetTop =
      this.sliderWrapper.nativeElement.offsetTop - this.navbarHeight;
  }

  private initSwiper(): void {
    new Swiper(this.swiperContainer.nativeElement, {
      modules: [Navigation, Pagination, Autoplay],
      loop: true,
      slidesPerView: 1,
      spaceBetween: 0,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const scrollTop = window.scrollY || this.document.documentElement.scrollTop;

    if (scrollTop > this.offsetTop) {
      // Si el usuario baja, fijar el slider y reducir su tamaño
      this.renderer.addClass(this.sliderWrapper.nativeElement, 'fixed-slider');
      this.renderer.addClass(this.sliderWrapper.nativeElement, 'small'); // Aplica la reducción de tamaño
      this.renderer.setStyle(
        this.sliderWrapper.nativeElement,
        'top',
        `${this.navbarHeight}px`
      );
    } else {
      // Si el usuario sube, quitar la clase fija y restaurar el tamaño
      this.renderer.removeClass(this.sliderWrapper.nativeElement, 'small');
      this.renderer.removeClass(
        this.sliderWrapper.nativeElement,
        'fixed-slider'
      );
      this.renderer.removeStyle(this.sliderWrapper.nativeElement, 'top');
    }
  }
}
