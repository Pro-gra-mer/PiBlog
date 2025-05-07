import { ActivatedRoute, Router } from '@angular/router';
import {
  Component,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import DOMPurify from 'dompurify';
import { DomSanitizer } from '@angular/platform-browser';
import { ArticleDetailComponent } from '../../../components/article-detail/article-detail.component';
import { Category, CategoryService } from '../../../services/category.service';
import { PiAuthService } from '../../../services/pi-auth.service';
import { environment } from '../../../environments/environment.dev';
import { PromoteType } from '../../../models/PromoteType';

declare const cloudinary: any;

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    QuillModule,
    ArticleDetailComponent,
  ],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css'],
})
export class CreateArticleComponent implements AfterViewInit {
  articleForm: FormGroup;
  message: string | null = null;
  isError: boolean = false;
  previewArticle: Article | null = null;
  userSubscribed: boolean = false;
  @ViewChild('quillEditor', { static: false }) quillEditor: any;
  articleIdToLoad: number | null = null;
  categories: Category[] = [];
  insertedImages: Array<{ url: string; publicId: string; uploadDate: string }> =
    [];
  isAdmin: boolean = false;
  private isSaving = false;
  activePlan: PromoteType = PromoteType.STANDARD;

  constructor(
    private formBuilder: FormBuilder,
    private articleService: ArticleService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private authService: PiAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.articleForm = this.formBuilder.group({
      company: ['', [Validators.required]],
      app: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      headerImage: [''],
      category: [null, Validators.required],
      content: ['', [Validators.required]],
      publishDate: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      promoteType: ['STANDARD'],
      promoVideo: [''],
      promoVideoPublicId: [''],
      promoVideoUploadDate: [''],
      headerImagePublicId: [''],
      headerImageUploadDate: [''],
    });
  }

  // Initializes component and loads data
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleIdToLoad = +id;
    }

    this.isAdmin = this.authService.isAdmin();

    this.categoryService.getAllCategories().subscribe({
      next: (categoriesFromDB) => {
        this.categories = categoriesFromDB;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load categories');
        }
        this.setErrorMessage('Failed to load categories.');
      },
    });

    if (!this.articleIdToLoad) {
      this.http
        .get<any>(`${environment.apiUrl}/api/payments/active-plan`)
        .subscribe({
          next: (data) => {
            this.activePlan = data.planType as PromoteType;
            this.articleForm.get('promoteType')?.setValue(this.activePlan);
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to fetch active plan');
            }
            this.activePlan = PromoteType.STANDARD;
            this.articleForm.get('promoteType')?.setValue(this.activePlan);
          },
        });
    }
  }

  // Placeholder for view initialization
  ngAfterViewInit(): void {}

  // Sets error message for UI
  private setErrorMessage(msg: string): void {
    this.isError = true;
    this.message = msg;
  }

  // Sets success message for UI
  private setSuccessMessage(msg: string): void {
    this.isError = false;
    this.message = msg;
  }

  // Counts total images in article
  private getTotalImagesCount(): number {
    let count = 0;
    if (this.articleForm.get('headerImage')?.value) {
      count++;
    }
    count += this.insertedImages.length;
    return count;
  }

  // Loads article by ID for editing
  loadArticle(id: number, quillInstance: any): void {
    this.articleService.getArticleById(id).subscribe({
      next: (article: Article) => {
        if (!environment.production) {
          console.log('Article loaded');
        }
        this.articleForm.patchValue(article);
        this.cdr.detectChanges();

        if (quillInstance) {
          quillInstance.setContents([]);
          quillInstance.clipboard.dangerouslyPasteHTML(
            0,
            article.content || ''
          );
          this.articleForm.get('content')?.setValue(article.content || '');
        } else {
          this.setErrorMessage('Editor not initialized yet.');
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(article.content, 'text/html');
        const imgElements = Array.from(doc.getElementsByTagName('img'));
        this.insertedImages = imgElements.map((img) => ({
          url: img.getAttribute('src') || '',
          publicId: '',
          uploadDate: new Date().toISOString(),
        }));
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load article');
        }
        this.setErrorMessage('The article could not be loaded.');
      },
    });
  }

  // Sanitizes content and adds loading="lazy" to images
  private sanitizeAndEnhanceContent(rawHtml: string): string {
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'a',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'img',
      ],
      ALLOWED_ATTR: ['href', 'target', 'src', 'style'],
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;

    tempDiv.querySelectorAll('img').forEach((img) => {
      img.setAttribute('loading', 'lazy');
    });

    return tempDiv.innerHTML;
  }

  // Previews article content
  onPreview(): void {
    const formValues = this.articleForm.value;
    const rawContent = formValues.content;
    // Usamos la nueva función para sanitizar y agregar loading="lazy"
    const sanitizedContent = this.sanitizeAndEnhanceContent(rawContent);
    this.previewArticle = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
    };
  }

  // Submits article for creation or update
  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.setErrorMessage('Please complete all fields correctly.');
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    this.isSaving = true;

    if (this.quillEditor && this.quillEditor.quill) {
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
    }

    const rawContent = this.articleForm.get('content')?.value;
    // Usamos la nueva función para sanitizar y agregar loading="lazy"
    const sanitizedContent = this.sanitizeAndEnhanceContent(rawContent);

    if (!sanitizedContent.trim()) {
      this.setErrorMessage('Content cannot be empty after sanitization.');
      return;
    }

    const formValues = this.articleForm.value;

    if (!formValues.promoteType || formValues.promoteType === 'STANDARD') {
      delete formValues.promoteType;
    }

    const articlePayload: Article = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
      status: this.isAdmin ? 'PUBLISHED' : 'PENDING_APPROVAL',
      category: formValues.category ? { name: formValues.category.name } : null,
      headerImageUploadDate: formValues.headerImageUploadDate
        ? new Date(formValues.headerImageUploadDate).toISOString()
        : null,
      promoVideoUploadDate: formValues.promoVideoUploadDate
        ? new Date(formValues.promoVideoUploadDate).toISOString()
        : null,
    };

    if (!articlePayload.category || !articlePayload.category.name) {
      this.setErrorMessage('Please select a valid category.');
      return;
    }

    if (!environment.production) {
      console.log('Submitting article payload');
    }

    if (this.articleIdToLoad) {
      this.articleService
        .updateArticle(this.articleIdToLoad, articlePayload)
        .subscribe({
          next: () => {
            this.setSuccessMessage(
              this.isAdmin
                ? 'Article published successfully.'
                : 'Article submitted for approval successfully.'
            );
            this.articleForm.reset({
              publishDate: new Date().toISOString().split('T')[0],
              promoteVideo: false,
            });
            this.previewArticle = null;
            this.insertedImages = [];
            this.isSaving = false;
            this.articleIdToLoad = null;

            setTimeout(() => {
              if (this.isAdmin) {
                this.router.navigate(['/dashboard/published']);
              } else {
                this.router.navigate(['/user-dashboard/pending']);
              }
            }, 2000);
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to update article');
            }
            this.setErrorMessage('Failed to update article. Please try again.');
            this.isSaving = false;
          },
        });
    } else {
      this.articleService.createArticle(articlePayload).subscribe({
        next: () => {
          this.setSuccessMessage(
            this.isAdmin
              ? 'Article published successfully.'
              : 'Article submitted for approval successfully.'
          );
          this.articleForm.reset({
            publishDate: new Date().toISOString().split('T')[0],
            promoteVideo: false,
          });
          this.previewArticle = null;
          this.insertedImages = [];
          this.isSaving = false;

          setTimeout(() => {
            if (this.isAdmin) {
              this.router.navigate(['/dashboard/published']);
            } else {
              this.router.navigate(['/user-dashboard/pending']);
            }
          }, 2000);
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to create article');
          }
          this.setErrorMessage('Failed to create article. Please try again.');
          this.isSaving = false;
        },
      });
    }
  }

  // Opens widget for header image upload
  openHeaderImageWidget(): void {
    if (this.articleForm.get('headerImage')?.value) {
      this.setErrorMessage('A header image has already been uploaded.');
      return;
    }
    if (this.getTotalImagesCount() >= 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    this.http.get(`${environment.apiUrl}/api/cloudinary-signature`).subscribe({
      next: (config: any) => {
        const widget = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            apiKey: config.apiKey,
            uploadSignature: config.signature,
            uploadSignatureTimestamp: config.timestamp,
            uploadPreset: config.uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            resourceType: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              const imageUrl = result.info.secure_url;
              const publicId = result.info.public_id;
              this.articleForm.get('headerImage')?.setValue(imageUrl);
              this.articleForm.get('headerImagePublicId')?.setValue(publicId);
              this.articleForm
                .get('headerImageUploadDate')
                ?.setValue(new Date().toISOString());
            } else if (error) {
              if (!environment.production) {
                console.error('Failed to upload header image');
              }
              this.setErrorMessage('Failed to upload header image.');
            }
          }
        );
        widget.open();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to configure header image upload');
        }
        this.setErrorMessage('Failed to configure header image upload.');
      },
    });
  }

  // Opens widget for editor image upload
  openUploadWidget(): void {
    if (!this.quillEditor || !this.quillEditor.quill) {
      this.setErrorMessage('Please wait for the editor to be ready.');
      return;
    }
    if (this.getTotalImagesCount() >= 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    this.http.get(`${environment.apiUrl}/api/cloudinary-signature`).subscribe({
      next: (config: any) => {
        const widget = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            apiKey: config.apiKey,
            uploadSignature: config.signature,
            uploadSignatureTimestamp: config.timestamp,
            uploadPreset: config.uploadPreset,
            sources: ['local', 'url', 'camera'],
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              const imageUrl = result.info.secure_url;
              const publicId = result.info.public_id;
              this.insertImageInEditor(imageUrl, publicId);
            } else if (error) {
              if (!environment.production) {
                console.error('Failed to upload editor image');
              }
              this.setErrorMessage('Failed to upload editor image.');
            }
          }
        );
        widget.open();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to configure editor image upload');
        }
        this.setErrorMessage('Failed to configure editor image upload.');
      },
    });
  }

  // Inserts image into Quill editor
  private insertImageInEditor(imageUrl: string, publicId: string): void {
    if (this.quillEditor && this.quillEditor.quill) {
      const range = this.quillEditor.quill.getSelection(true) || { index: 0 };
      this.quillEditor.quill.insertEmbed(range.index, 'image', imageUrl);
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
      this.insertedImages.push({
        url: imageUrl,
        publicId: publicId,
        uploadDate: new Date().toISOString(),
      });
    } else {
      this.setErrorMessage('The editor is not ready.');
    }
  }

  // Configures Quill editor and handles events
  onEditorCreated(quillInstance: any): void {
    if (this.isSaving) return;
    import('quill')
      .then(() => {
        const toolbar = quillInstance.getModule('toolbar');
        toolbar.addHandler('image', this.openUploadWidget.bind(this));
        this.quillEditor = { quill: quillInstance };

        if (this.articleIdToLoad) {
          this.loadArticle(this.articleIdToLoad, quillInstance);
        }

        quillInstance.on('text-change', () => {
          if (this.isSaving) return;
          const currentHTML = quillInstance.root.innerHTML;

          const parser = new DOMParser();
          const doc = parser.parseFromString(currentHTML, 'text/html');
          const imgElements = Array.from(doc.getElementsByTagName('img'));
          const currentUrls = imgElements.map((img) => img.getAttribute('src'));

          const removedImages: {
            url: string;
            publicId: string;
            uploadDate: string;
          }[] = [];
          this.insertedImages = this.insertedImages.filter((imgData) => {
            if (!currentUrls.includes(imgData.url)) {
              removedImages.push(imgData);
              return false;
            }
            return true;
          });

          removedImages.forEach((imgData) => {
            this.articleService.deleteOrphanImage(imgData.publicId).subscribe({
              next: () => {
                if (!environment.production) {
                  console.log('Orphan image deleted');
                }
              },
              error: () => {
                if (!environment.production) {
                  console.error('Failed to delete orphan image');
                }
              },
            });
          });
        });
      })
      .catch(() => {
        if (!environment.production) {
          console.error('Failed to load Quill');
        }
        this.setErrorMessage('Failed to initialize editor.');
      });
  }

  // Removes header image from article
  removeHeaderImage(): void {
    const publicId = this.articleForm.get('headerImagePublicId')?.value;
    if (publicId) {
      this.articleService.deleteOrphanImage(publicId).subscribe({
        next: () => {
          if (!environment.production) {
            console.log('Header image deleted');
          }
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to delete header image');
          }
          this.setErrorMessage('Failed to remove header image.');
        },
      });
    }
    this.articleForm.get('headerImage')?.setValue('');
    this.articleForm.get('headerImagePublicId')?.setValue('');
    this.articleForm.get('headerImageUploadDate')?.setValue('');
  }

  // Saves article as draft
  saveDraft(): void {
    if (this.articleForm.invalid) {
      this.setErrorMessage('Please complete all fields correctly.');
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    this.isSaving = true;

    if (this.quillEditor && this.quillEditor.quill) {
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
    }

    const rawContent = this.articleForm.get('content')?.value;
    // Usamos la nueva función para sanitizar y agregar loading="lazy"
    const sanitizedContent = this.sanitizeAndEnhanceContent(rawContent);

    const formValues = this.articleForm.value;

    const articlePayload: Article = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
      status: 'DRAFT',
      promoteType: formValues.promoteType,
      category: {
        name: formValues.category.name,
      },
    };

    if (this.articleIdToLoad) {
      this.articleService
        .updateArticle(this.articleIdToLoad, articlePayload)
        .subscribe({
          next: () => {
            this.setSuccessMessage('Draft updated successfully.');
            setTimeout(() => {
              this.router.navigate(['/user-dashboard/drafts']);
            }, 3000);
            this.articleForm.reset({
              publishDate: new Date().toISOString().split('T')[0],
              promoteVideo: false,
            });
            this.previewArticle = null;
            this.insertedImages = [];
            this.articleIdToLoad = null;
            this.isSaving = false;
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to update draft');
            }
            this.setErrorMessage('Failed to update draft.');
            this.isSaving = false;
          },
        });
    } else {
      this.articleService.createArticle(articlePayload).subscribe({
        next: () => {
          this.setSuccessMessage('Draft saved successfully.');
          this.articleForm.reset({
            publishDate: new Date().toISOString().split('T')[0],
            promoteVideo: false,
          });
          this.previewArticle = null;
          this.insertedImages = [];
          this.articleIdToLoad = null;
          this.isSaving = false;
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to save draft');
          }
          this.setErrorMessage('Failed to save draft.');
          this.isSaving = false;
        },
      });
    }
  }

  // Opens widget for promotional video upload
  openVideoUploadWidget(): void {
    if (this.articleForm.get('promoVideo')?.value) {
      this.setErrorMessage('You have already uploaded a promotional video.');
      return;
    }

    this.http.get(`${environment.apiUrl}/api/cloudinary-signature`).subscribe({
      next: (config: any) => {
        const widget = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            apiKey: config.apiKey,
            uploadSignature: config.signature,
            uploadSignatureTimestamp: config.timestamp,
            uploadPreset: config.uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            resourceType: 'video',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            maxFileSize: 30 * 1024 * 1024,
            maxVideoDuration: 20,
          },
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              const videoUrl = result.info.secure_url;
              const publicId = result.info.public_id;
              this.articleForm.get('promoVideo')?.setValue(videoUrl);
              this.articleForm.get('promoVideoPublicId')?.setValue(publicId);
              this.articleForm
                .get('promoVideoUploadDate')
                ?.setValue(new Date().toISOString());
            } else if (error) {
              if (!environment.production) {
                console.error('Failed to upload video');
              }
              this.setErrorMessage('Failed to upload video.');
            }
          }
        );
        widget.open();
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to configure video upload');
        }
        this.setErrorMessage('Failed to configure video upload.');
      },
    });
  }

  // Removes promotional video from article
  removePromoVideo(): void {
    const publicId = this.articleForm.get('promoVideoPublicId')?.value;
    if (publicId) {
      this.articleService.deleteOrphanVideo(publicId).subscribe({
        next: () => {
          if (!environment.production) {
            console.log('Promotional video deleted');
          }
        },
        error: () => {
          if (!environment.production) {
            console.error('Failed to delete promotional video');
          }
          this.setErrorMessage('Failed to remove promotional video.');
        },
      });
    }
    this.articleForm.get('promoVideo')?.setValue('');
    this.articleForm.get('promoVideoPublicId')?.setValue('');
    this.articleForm.get('promoVideoUploadDate')?.setValue('');
  }

  // Gets label for promote type
  get promoteTypeLabel(): string {
    switch (this.promoteTypeValue) {
      case 'MAIN_SLIDER':
        return 'Main slider';
      case 'CATEGORY_SLIDER':
        return 'Category slider';
      default:
        return 'No slider (Standard plan)';
    }
  }

  // Gets current promote type value
  get promoteTypeValue(): string {
    return this.articleForm.get('promoteType')?.value || 'STANDARD';
  }
}
