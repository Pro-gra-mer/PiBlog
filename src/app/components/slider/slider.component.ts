import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import { StickyHeaderDirective } from '../../directives/sticky-header.directive';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, StickyHeaderDirective],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
})
export class SliderComponent implements AfterViewInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  videos: SafeResourceUrl[] = [];

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Sanitiza las URLs para que sean seguras en Angular
    this.videos = [
      this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://res.cloudinary.com/dl7on9tjj/video/upload/v1741015277/20250303_1538_Digital_Pi_Coin_simple_compose_01jne73zyeff99qx8rxm8mp5r8_azlgto.mp4'
      ),
      this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://res.cloudinary.com/dl7on9tjj/video/upload/v1740946770/202368-918049003_azmu9u.mp4'
      ),
      this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://res.cloudinary.com/dl7on9tjj/video/upload/v1741097504/20250304_1451_Blockchain_Animation_Unveiled_simple_compose_01jngpte8gfppb5mad5e56vpwe_sqt9gf.mp4'
      ),
    ];
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      new Swiper(this.swiperContainer.nativeElement, {
        modules: [Autoplay, Navigation],
        loop: true,
        slidesPerView: 1, // ✅ Muestra solo un video a la vez
        autoplay: {
          delay: 5000, // ✅ Cambia de video cada 5 segundos
          disableOnInteraction: false, // ✅ No se detiene al interactuar con el slider
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    }
  }
}
