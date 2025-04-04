import { ActivatedRoute } from '@angular/router';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
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

  constructor(
    private formBuilder: FormBuilder,
    private articleService: ArticleService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private authService: PiAuthService
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
      promoteVideo: [{ value: false, disabled: !this.userSubscribed }],
      promoVideo: [''],
      promoVideoPublicId: [''],
      promoVideoUploadDate: [''],
      headerImagePublicId: [''],
      headerImageUploadDate: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleIdToLoad = +id;
    }

    this.isAdmin = this.authService.isAdmin(); // detectar si es admin

    this.categoryService.getAllCategories().subscribe({
      next: (categoriesFromDB) => {
        this.categories = categoriesFromDB;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.setErrorMessage('Failed to load categories.');
      },
    });
  }

  ngAfterViewInit(): void {}

  private setErrorMessage(msg: string): void {
    this.isError = true;
    this.message = msg;
  }

  private setSuccessMessage(msg: string): void {
    this.isError = false;
    this.message = msg;
  }

  private getTotalImagesCount(): number {
    let count = 0;
    if (this.articleForm.get('headerImage')?.value) {
      count++;
    }
    count += this.insertedImages.length;
    return count;
  }

  loadArticle(id: number, quillInstance: any): void {
    this.articleService.getArticleById(id).subscribe({
      next: (article: Article) => {
        this.articleForm.patchValue(article);

        if (quillInstance && article.content) {
          quillInstance.setContents([]);
          quillInstance.clipboard.dangerouslyPasteHTML(0, article.content);
          this.articleForm.get('content')?.setValue(article.content);
        } else {
          this.setErrorMessage('Editor not initialized or without content');
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
      error: (err) => {
        console.error('Error loading article:', err);
        this.setErrorMessage('The article could not be loaded.');
      },
    });
  }

  onPreview(): void {
    const formValues = this.articleForm.value;
    const rawContent = formValues.content;
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
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
    this.previewArticle = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
    };
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.setErrorMessage('Please complete all fields correctly.');
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.setErrorMessage(
        'The article cannot contain more than 5 images in total.'
      );
      return;
    }

    if (this.quillEditor && this.quillEditor.quill) {
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
    }

    const rawContent = this.articleForm.get('content')?.value;
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
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

    if (!sanitizedContent.trim()) {
      this.setErrorMessage('The content cannot be empty after sanitization.');
      return;
    }

    const formValues = this.articleForm.value;

    const articlePayload: Article = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
      status: this.isAdmin ? 'PUBLISHED' : 'PENDING_APPROVAL',
      category: {
        name: formValues.category.name,
      },
    };

    if (this.articleIdToLoad) {
      this.articleService
        .updateArticle(this.articleIdToLoad, articlePayload)
        .subscribe({
          next: () => {
            this.setSuccessMessage('Article updated correctly.');
            this.articleForm.reset({
              publishDate: new Date().toISOString().split('T')[0],
              promoteVideo: false,
            });
            this.previewArticle = null;
            this.insertedImages = [];
            this.articleIdToLoad = null;
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error updating article:', err);
            this.setErrorMessage(
              `Error updating: ${err.status} - ${
                err.statusText || 'No details'
              }`
            );
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
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error saving article:', err);
          this.setErrorMessage(
            `Saving error: ${err.status} - ${err.statusText || 'No details'}`
          );
        },
      });
    }
  }

  openHeaderImageWidget(): void {
    if (this.articleForm.get('headerImage')?.value) {
      this.setErrorMessage('A header image has already been uploaded.');
      return;
    }
    if (this.getTotalImagesCount() >= 5) {
      this.setErrorMessage(
        'The article cannot contain more than 5 images in total.'
      );
      return;
    }

    this.http.get('http://localhost:8080/api/cloudinary-signature').subscribe({
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
              console.error('Error subiendo header image:', error);
              this.setErrorMessage(
                'Error uploading header image: ' +
                  (error.statusText || 'Desconocido')
              );
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo la firma para header image:', err);
        this.setErrorMessage('Failed to configure header image upload.');
      },
    });
  }

  openUploadWidget(): void {
    if (!this.quillEditor || !this.quillEditor.quill) {
      this.setErrorMessage('Please wait for the editor to be ready.');
      return;
    }
    if (this.getTotalImagesCount() >= 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    this.http.get('http://localhost:8080/api/cloudinary-signature').subscribe({
      next: (config: any) => {
        const widget = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            apiKey: config.apiKey,
            uploadSignature: config.signature,
            uploadSignatureTimestamp: config.timestamp,
            uploadPreset: config.uploadPreset,
            sources: ['local', 'url', 'camera'],
          },
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              const imageUrl = result.info.secure_url;
              const publicId = result.info.public_id;
              this.insertImageInEditor(imageUrl, publicId);
            } else if (error) {
              console.error('Error subiendo imagen en editor:', error);
              this.setErrorMessage(
                'Error uploading image: ' + (error.statusText || 'Desconocido')
              );
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo la firma para imagen:', err);
        this.setErrorMessage('Failed to configure image upload.');
      },
    });
  }

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
      this.setErrorMessage(
        'The image could not be inserted because the editor is not ready.'
      );
    }
  }

  onEditorCreated(quillInstance: any): void {
    import('quill')
      .then(() => {
        const toolbar = quillInstance.getModule('toolbar');
        toolbar.addHandler('image', this.openUploadWidget.bind(this));
        this.quillEditor = { quill: quillInstance };

        if (this.articleIdToLoad) {
          this.loadArticle(this.articleIdToLoad, quillInstance);
        }

        quillInstance.on('text-change', () => {
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
                console.log(
                  `Imagen con publicId ${imgData.publicId} eliminada de Cloudinary.`
                );
              },
              error: (err) => {
                console.error(
                  `Error eliminando imagen con publicId ${imgData.publicId}:`,
                  err
                );
              },
            });
          });
        });
      })
      .catch((error) => {
        console.error('Error loading Quill:', error);
        this.setErrorMessage('No se pudo inicializar el editor.');
      });
  }

  removeHeaderImage(): void {
    const publicId = this.articleForm.get('headerImagePublicId')?.value;
    if (publicId) {
      this.articleService.deleteOrphanImage(publicId).subscribe({
        next: () => {
          console.log(
            `Imagen con publicId ${publicId} eliminada de Cloudinary.`
          );
        },
        error: (err) => {
          console.error(
            `Error eliminando imagen con publicId ${publicId}:`,
            err
          );
          this.setErrorMessage('Failed to remove header image.');
        },
      });
    }
    this.articleForm.get('headerImage')?.setValue('');
    this.articleForm.get('headerImagePublicId')?.setValue('');
    this.articleForm.get('headerImageUploadDate')?.setValue('');
  }

  saveDraft(): void {
    if (this.articleForm.invalid) {
      this.setErrorMessage('Please complete all fields correctly.');
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.setErrorMessage('The article cannot contain more than 5 images.');
      return;
    }

    if (this.quillEditor && this.quillEditor.quill) {
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
    }

    const rawContent = this.articleForm.get('content')?.value;
    const sanitizedContent = DOMPurify.sanitize(rawContent, {
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

    const formValues = this.articleForm.value;

    const articlePayload: Article = {
      ...formValues,
      content: sanitizedContent,
      approved: false,
      status: 'DRAFT',
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
            this.articleForm.reset({
              publishDate: new Date().toISOString().split('T')[0],
              promoteVideo: false,
            });
            this.previewArticle = null;
            this.insertedImages = [];
            this.articleIdToLoad = null;
          },
          error: (err) => {
            console.error('Error actualizando el borrador:', err);
            this.setErrorMessage('The draft could not be updated.');
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
        },
        error: (err) => {
          console.error('Error guardando el borrador:', err);
          this.setErrorMessage('The draft could not be saved.');
        },
      });
    }
  }

  openVideoUploadWidget(): void {
    if (this.articleForm.get('promoVideo')?.value) {
      this.setErrorMessage('You have already uploaded a promotional video.');
      return;
    }

    this.http.get('http://localhost:8080/api/cloudinary-signature').subscribe({
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
            maxFileSize: 30 * 1024 * 1024,
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
              console.error('Error subiendo video:', error);
              this.setErrorMessage(
                'Error uploading video: ' + (error.statusText || 'Desconocido')
              );
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo firma para video:', err);
        this.setErrorMessage('Could not configure video upload.');
      },
    });
  }

  removePromoVideo(): void {
    const publicId = this.articleForm.get('promoVideoPublicId')?.value;
    if (publicId) {
      this.articleService.deleteOrphanVideo(publicId).subscribe({
        next: () => {
          console.log(
            `Video con publicId ${publicId} eliminado de Cloudinary.`
          );
        },
        error: (err) => {
          console.error(
            `Error eliminando video con publicId ${publicId}:`,
            err
          );
          this.setErrorMessage('Failed to remove promotional video.');
        },
      });
    }
    this.articleForm.get('promoVideo')?.setValue('');
    this.articleForm.get('promoVideoPublicId')?.setValue('');
    this.articleForm.get('promoVideoUploadDate')?.setValue('');
  }
}
