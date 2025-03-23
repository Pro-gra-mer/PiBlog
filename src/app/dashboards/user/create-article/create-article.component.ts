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
  previewArticle: Article | null = null;
  userSubscribed: boolean = false;
  @ViewChild('quillEditor', { static: false }) quillEditor: any;
  articleIdToLoad: number | null = null;

  // Lista para llevar registro de las imágenes insertadas en el editor
  insertedImages: Array<{ url: string; publicId: string; uploadDate: string }> =
    [];

  categories = [
    'Marketplaces',
    'Productivity Tools',
    'Education',
    'Social & Community',
    'Digital Services',
    'Games',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private articleService: ArticleService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {
    this.articleForm = this.formBuilder.group({
      company: ['', [Validators.required]],
      app: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      headerImage: [''],
      category: ['', [Validators.required]],
      content: ['', [Validators.required]],
      publishDate: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      promoteVideo: [{ value: false, disabled: !this.userSubscribed }],
      // Campos para el manejo de la imagen de cabecera
      headerImagePublicId: [''],
      headerImageUploadDate: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.articleIdToLoad = +id;
    }
  }

  ngAfterViewInit(): void {}

  // Devuelve el total de imágenes: suma 1 si existe headerImage + imágenes insertadas
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
        // Actualizar el formulario con los valores del artículo
        this.articleForm.patchValue(article);

        if (quillInstance && article.content) {
          // Limpiar el contenido existente del editor antes de cargar el nuevo
          quillInstance.setContents([]); // Limpia el editor
          // Insertar el contenido del artículo
          quillInstance.clipboard.dangerouslyPasteHTML(0, article.content);
          // Asegurarse de que el formulario refleje el contenido cargado
          this.articleForm.get('content')?.setValue(article.content);
        } else {
          this.message = 'Editor no inicializado o sin contenido';
        }

        // Si hay imágenes en el contenido, actualizar insertedImages
        const parser = new DOMParser();
        const doc = parser.parseFromString(article.content, 'text/html');
        const imgElements = Array.from(doc.getElementsByTagName('img'));
        this.insertedImages = imgElements.map((img) => ({
          url: img.getAttribute('src') || '',
          publicId: '', // Necesitarías obtener el publicId de alguna manera, si está disponible
          uploadDate: new Date().toISOString(),
        }));
      },
      error: (err) => {
        console.error('Error cargando artículo:', err);
        this.message = 'No se pudo cargar el artículo.';
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
      this.message = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.message =
        'El artículo no puede contener más de 5 imágenes en total.';
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
      this.message =
        'El contenido no puede estar vacío después de la sanitización.';
      return;
    }

    const articlePayload: Article = {
      ...this.articleForm.value,
      content: sanitizedContent,
      approved: false,
      status: 'PENDING_APPROVAL',
    };

    if (this.articleIdToLoad) {
      this.articleService
        .updateArticle(this.articleIdToLoad, articlePayload)
        .subscribe({
          next: () => {
            this.message = 'Artículo actualizado correctamente.';
            this.articleForm.reset({
              publishDate: new Date().toISOString().split('T')[0],
              promoteVideo: false,
            });
            this.previewArticle = null;
            this.insertedImages = [];
            this.articleIdToLoad = null;
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error actualizando el artículo:', err);
            this.message = `Error al actualizar: ${err.status} - ${
              err.statusText || 'Sin detalles'
            }`;
          },
        });
    } else {
      this.articleService.createArticle(articlePayload).subscribe({
        next: () => {
          this.message = 'Artículo enviado para aprobación exitosamente.';
          this.articleForm.reset({
            publishDate: new Date().toISOString().split('T')[0],
            promoteVideo: false,
          });
          this.previewArticle = null;
          this.insertedImages = [];
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error guardando el artículo:', err);
          this.message = `Error al guardar: ${err.status} - ${
            err.statusText || 'Sin detalles'
          }`;
        },
      });
    }
  }

  openHeaderImageWidget(): void {
    // Verificar que no exista ya una imagen de cabecera
    if (this.articleForm.get('headerImage')?.value) {
      this.message = 'Ya se ha subido una imagen de cabecera.';
      return;
    }
    // Verificar que el total de imágenes no supere el límite
    if (this.getTotalImagesCount() >= 5) {
      this.message =
        'El artículo no puede contener más de 5 imágenes en total.';
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
              this.message =
                'Error al subir la imagen de cabecera: ' +
                (error.statusText || 'Desconocido');
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo la firma para header image:', err);
        this.message =
          'No se pudo configurar la subida de la imagen de cabecera.';
      },
    });
  }

  openUploadWidget(): void {
    if (!this.quillEditor || !this.quillEditor.quill) {
      this.message = 'Por favor, espera a que el editor esté listo.';
      return;
    }
    // Verificar que no se exceda el límite total de imágenes
    if (this.getTotalImagesCount() >= 5) {
      this.message = 'El artículo no puede contener más de 5 imágenes.';
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
              this.message =
                'Error al subir la imagen: ' +
                (error.statusText || 'Desconocido');
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo la firma para imagen:', err);
        this.message = 'No se pudo configurar la subida de imágenes.';
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
      this.message =
        'No se pudo insertar la imagen porque el editor no está listo.';
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
          console.log('Current HTML:', currentHTML);

          const parser = new DOMParser();
          const doc = parser.parseFromString(currentHTML, 'text/html');
          const imgElements = Array.from(doc.getElementsByTagName('img'));
          const currentUrls = imgElements.map((img) => img.getAttribute('src'));
          console.log('Current image URLs:', currentUrls);

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
          console.log('Removed images:', removedImages);

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
        this.message = 'No se pudo inicializar el editor.';
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
        },
      });
    }
    // Limpia los campos del formulario, eliminando la imagen localmente
    this.articleForm.get('headerImage')?.setValue('');
    this.articleForm.get('headerImagePublicId')?.setValue('');
    this.articleForm.get('headerImageUploadDate')?.setValue('');
  }

  saveDraft(): void {
    if (this.articleForm.invalid) {
      this.message = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    if (this.getTotalImagesCount() > 5) {
      this.message = 'El artículo no puede contener más de 5 imágenes.';
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

    const articlePayload: Article = {
      ...this.articleForm.value,
      content: sanitizedContent,
      approved: false,
      status: 'DRAFT',
    };

    if (this.articleIdToLoad) {
      this.articleService
        .updateArticle(this.articleIdToLoad, articlePayload)
        .subscribe({
          next: () => {
            this.message = 'Borrador actualizado correctamente.';
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
            this.message = 'No se pudo actualizar el borrador.';
          },
        });
    } else {
      this.articleService.createArticle(articlePayload).subscribe({
        next: () => {
          this.message = 'Borrador guardado correctamente.';
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
          this.message = 'No se pudo guardar el borrador.';
        },
      });
    }
  }
}
