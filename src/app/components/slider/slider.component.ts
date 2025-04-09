import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  Input,
  SimpleChanges,
  OnChanges,
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
export class SliderComponent implements AfterViewInit, OnChanges {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  videos: SafeResourceUrl[] = [];
  private swiperInstance: Swiper | undefined;
  private isBrowser: boolean;
  @Input() customVideos: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private sanitizer: DomSanitizer,
    private promotedVideoService: PromotedVideoService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Si no hay customVideos, cargamos los videos MAIN como fallback
    if (!this.customVideos.length) {
      this.loadMainVideos();
    } else if (this.videos.length) {
      this.initSwiper();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;

    if (changes['customVideos'] && this.customVideos?.length > 0) {
      this.videos = this.customVideos.map((url) =>
        this.sanitizer.bypassSecurityTrustResourceUrl(url)
      );
      this.destroySwiper();
      setTimeout(() => {
        this.initSwiper();
        this.ensureVideosPlay();
      }, 100);
    }
  }

  // Método para cargar videos MAIN como fallback
  loadMainVideos(): void {
    this.promotedVideoService.getPromotedVideos().subscribe({
      next: (urls) => {
        this.videos = urls.map((url) =>
          this.sanitizer.bypassSecurityTrustResourceUrl(url)
        );
        setTimeout(() => {
          this.initSwiper();
          this.ensureVideosPlay();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading MAIN videos:', err);
      },
    });
  }

  initSwiper(): void {
    if (!this.swiperContainer?.nativeElement) return;

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

  ensureVideosPlay(): void {
    const videos = this.swiperContainer.nativeElement.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
      video.muted = true;
      video.play().catch((error) => {
        console.log('Error al intentar reproducir video:', error);
      });
    });
  }

  destroySwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroySwiper();
  }
}
