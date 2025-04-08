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
import { PromotedVideoService } from '../../services/promoted-video.service';

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
  private swiperInstance: Swiper | undefined;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private sanitizer: DomSanitizer,
    private promotedVideoService: PromotedVideoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadPromotedVideos();
    }
  }

  loadPromotedVideos(): void {
    this.promotedVideoService.getPromotedVideos().subscribe({
      next: (urls) => {
        const limited = urls.slice(0, 10);
        this.videos = limited.map((url) =>
          this.sanitizer.bypassSecurityTrustResourceUrl(url)
        );
        // Retrasamos la inicialización para asegurar que el DOM esté listo
        setTimeout(() => {
          this.initSwiper();
          this.ensureVideosPlay();
        }, 100);
      },
      error: () => {
        console.error('Error loading promoted videos');
      },
    });
  }

  initSwiper(): void {
    this.swiperInstance = new Swiper(this.swiperContainer.nativeElement, {
      modules: [Autoplay, Navigation],
      loop: true,
      slidesPerView: 1,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      on: {
        slideChange: () => {
          this.ensureVideosPlay();
        },
      },
    });
  }

  // Método para asegurar que los videos se reproduzcan
  ensureVideosPlay(): void {
    const videos = this.swiperContainer.nativeElement.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
      video.muted = true; // Asegura que esté silenciado (requerido para autoplay)
      video.play().catch((error) => {
        console.log('Error al intentar reproducir video:', error);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy();
    }
  }
}
