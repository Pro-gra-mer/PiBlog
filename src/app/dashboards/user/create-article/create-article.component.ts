import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import DOMPurify from 'dompurify';

declare const cloudinary: any;

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, QuillModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.css'],
})
export class CreateArticleComponent implements AfterViewInit {
  articleForm: FormGroup;
  message: string | null = null;
  previewHtml: string = '';
  userSubscribed: boolean = false;
  @ViewChild('quillEditor', { static: false }) quillEditor: any;

  private articleIdToLoad: number | null = null;

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
    private http: HttpClient
  ) {
    this.articleForm = this.formBuilder.group({
      company: ['', [Validators.required]],
      app: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', [Validators.required]],
      content: ['', [Validators.required]],
      publishDate: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      promoteVideo: [{ value: false, disabled: !this.userSubscribed }],
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

  loadArticle(id: number, quillInstance: any): void {
    this.articleService.getArticleById(id).subscribe({
      next: (article: Article) => {
        this.articleForm.patchValue(article);
        if (quillInstance && article.content) {
          quillInstance.clipboard.dangerouslyPasteHTML(0, article.content);
        } else {
          this.message = 'Editor no inicializado o sin contenido';
        }
      },
      error: (err) => {
        console.error('Error cargando artículo:', err);
        this.message = 'No se pudo cargar el artículo.';
      },
    });
  }

  onPreview(): void {
    const rawContent = this.articleForm.get('content')?.value;
    this.previewHtml = DOMPurify.sanitize(rawContent, {
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
      ALLOWED_ATTR: ['href', 'target', 'src'],
    });
  }

  onSubmit(): void {
    if (this.articleForm.invalid) {
      this.message = 'Por favor, completa todos los campos correctamente.';
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
      ALLOWED_ATTR: ['href', 'target', 'src'],
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
    };

    this.articleService.createArticle(articlePayload).subscribe({
      next: (response: Article) => {
        this.message = 'Artículo enviado para aprobación exitosamente.';
        this.articleForm.reset({
          publishDate: new Date().toISOString().split('T')[0],
          promoteVideo: false,
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error guardando el artículo:', err);
        this.message = `Error al guardar: ${err.status} - ${
          err.statusText || 'Sin detalles'
        }`;
      },
    });
  }

  openUploadWidget(): void {
    if (!this.quillEditor || !this.quillEditor.quill) {
      this.message = 'Por favor, espera a que el editor esté listo.';
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
            source: config.source,
            sources: ['local', 'url', 'camera'],
          },
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              const imageUrl = result.info.secure_url;
              this.insertImageInEditor(imageUrl);
            } else if (error) {
              console.error('Error en el widget:', error);
              this.message =
                'Error al subir la imagen: ' +
                (error.statusText || 'Desconocido');
            }
          }
        );
        widget.open();
      },
      error: (err) => {
        console.error('Error obteniendo la firma:', err);
        this.message = 'No se pudo configurar la subida de imágenes.';
      },
    });
  }

  private insertImageInEditor(imageUrl: string): void {
    if (this.quillEditor && this.quillEditor.quill) {
      const range = this.quillEditor.quill.getSelection(true) || { index: 0 };
      this.quillEditor.quill.insertEmbed(range.index, 'image', imageUrl);
      const img = this.quillEditor.quill.root.querySelector(
        `img[src="${imageUrl}"]`
      );
      if (img) {
        img.style.maxWidth = '300px';
        img.style.height = 'auto';
      }
      const currentContent = this.quillEditor.quill.root.innerHTML;
      this.articleForm.get('content')?.setValue(currentContent);
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
          this.articleIdToLoad = null;
        }
      })
      .catch((error) => {
        console.error('Error loading Quill:', error);
        this.message = 'No se pudo inicializar el editor.';
      });
  }
}
