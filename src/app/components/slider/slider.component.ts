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
import { environment } from '../../environments/environment.dev';

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

  // Initializes component after view is ready
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    if (!this.customVideos.length) {
      this.loadMainVideos();
    } else if (this.videos.length) {
      this.initSwiper();
    }
  }

  // Handles changes to customVideos input
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

  // Loads main promoted videos from service
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
      error: () => {
        if (!environment.production) {
          console.error('Failed to load main videos');
        }
      },
    });
  }

  // Initializes Swiper carousel
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

  // Ensures videos play in active slide
  ensureVideosPlay(): void {
    const videos = this.swiperContainer.nativeElement.querySelectorAll('video');
    videos.forEach((video: HTMLVideoElement) => {
      video.muted = true;
      video.play().catch(() => {
        if (!environment.production) {
          console.error('Failed to play video');
        }
      });
    });
  }

  // Destroys Swiper instance
  destroySwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = undefined;
    }
  }

  // Cleans up on component destruction
  ngOnDestroy(): void {
    this.destroySwiper();
  }
}
