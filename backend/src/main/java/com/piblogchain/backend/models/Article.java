package com.piblogchain.backend.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.piblogchain.backend.enums.ArticleStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import com.piblogchain.backend.enums.PromoteType;


@Entity
@Table(name = "articles")
public class Article {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(description = "Unique identifier of the article", example = "1")
  private Long id;

  @Column(nullable = false)
  @Schema(description = "Name of the company", example = "TechCorp")
  private String company;

  @Column(nullable = false)
  @Schema(description = "Name of the app", example = "AppName")
  private String app;

  @Column(nullable = false, length = 100)
  @Schema(description = "Title of the article", example = "An Amazing Article")
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  @Schema(
    description = "Brief description of the article for SEO and summary",
    example = "This article explains the benefits of using Cloudinary for media uploads."
  )
  private String description;

  @Column(name = "header_image")
  @Schema(
    description = "URL of the header image for the article",
    example = "https://res.cloudinary.com/dl7on9tjj/image/upload/v1742237037/xdfa4mb0d22ydyxzyvfu.jpg"
  )
  private String headerImage;

  @Column(name = "header_image_public_id")
  @Schema(
    description = "Public ID of the header image in Cloudinary",
    example = "xkz12abc"
  )
  private String headerImagePublicId;

  @Column(name = "header_image_upload_date")
  @Schema(
    description = "Upload date of the header image",
    example = "2025-03-16T12:34:56"
  )
  private LocalDateTime headerImageUploadDate;

  @Column(name = "category") // Mapea al campo category en la tabla
  @Schema(description = "Name of the category", example = "Marketplaces")
  private String categoryName; // Nombre de la categoría como String

  @Column(name = "category_slug")
  @Schema(description = "Slug of the category", example = "marketplaces")
  private String categorySlug;

  @ManyToOne
  @JoinColumn(name = "category_id") // Relación con la tabla categories
  @Schema(description = "Category object referencing the category ID", example = "Category{id=3, name='Marketplaces'}")
  private Category category;

  @Lob
  @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
  @Schema(description = "Content of the article", example = "This article explains...")
  private String content;

  @Column(nullable = false)
  @Schema(description = "Publication date of the article", example = "2025-03-16")
  private LocalDate publishDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Schema(
    description = "Indicates the status of the article",
    example = "DRAFT"
  )
  private ArticleStatus status = ArticleStatus.DRAFT;

  @Column(nullable = false)
  @Schema(description = "Username of the creator", example = "rebeca")
  private String createdBy;

  @Schema(description = "URL of the promo video", example = "https://res.cloudinary.com/yourcloud/video/upload/v1234567890/promo.mp4")
  @Column(name = "promo_video")
  private String promoVideo;

  @Schema(description = "Public ID of the promo video in Cloudinary", example = "video_xkz12abc")
  @Column(name = "promo_video_public_id")
  private String promoVideoPublicId;

  @Schema(description = "Upload date of the promo video", example = "2025-03-26T15:45:00")
  @Column(name = "promo_video_upload_date")
  private LocalDateTime promoVideoUploadDate;

  @Column(name = "rejection_reason")
  @Schema(description = "Reason for article rejection", example = "The article did not meet quality standards.")
  private String rejectionReason;

  @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ArticlePromotion> promotions = new ArrayList<>();

  @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<ArticlePromotion> activePlans = new ArrayList<>();


  // Constructor por defecto
  public Article() {}

  // Constructor con parámetros
  public Article(String company, String app, String title, String description,
                 String headerImage, String headerImagePublicId, LocalDateTime headerImageUploadDate,
                 Category category, String content, LocalDate publishDate,
                 String promoVideo, String promoVideoPublicId, LocalDateTime promoVideoUploadDate,
                 ArticleStatus status, String createdBy, String rejectionReason) {
    this.company = company;
    this.app = app;
    this.title = title;
    this.description = description;
    this.headerImage = headerImage;
    this.headerImagePublicId = headerImagePublicId;
    this.headerImageUploadDate = headerImageUploadDate;
    this.category = category; // Relación con Category
    this.categoryName = (category != null) ? category.getName() : null; // Asigna el nombre de la categoría
    this.categorySlug = (category != null) ? category.getSlug() : null;
    this.content = content;
    this.publishDate = publishDate;
    this.promoVideo = promoVideo;
    this.promoVideoPublicId = promoVideoPublicId;
    this.promoVideoUploadDate = promoVideoUploadDate;
    this.status = status;
    this.createdBy = createdBy;
    this.rejectionReason = rejectionReason;
  }

  // Getters y Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getCompany() {
    return company;
  }

  public void setCompany(String company) {
    this.company = company;
  }

  public String getApp() {
    return app;
  }

  public void setApp(String app) {
    this.app = app;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getHeaderImage() {
    return headerImage;
  }

  public void setHeaderImage(String headerImage) {
    this.headerImage = headerImage;
  }

  public String getHeaderImagePublicId() {
    return headerImagePublicId;
  }

  public void setHeaderImagePublicId(String headerImagePublicId) {
    this.headerImagePublicId = headerImagePublicId;
  }

  public LocalDateTime getHeaderImageUploadDate() {
    return headerImageUploadDate;
  }

  public void setHeaderImageUploadDate(LocalDateTime headerImageUploadDate) {
    this.headerImageUploadDate = headerImageUploadDate;
  }

  public String getCategoryName() {
    return categoryName;
  }

  public void setCategoryName(String categoryName) {
    this.categoryName = categoryName; // Corrige el setter para asignar el valor
  }

  public String getCategorySlug() {
    return categorySlug;
  }

  public void setCategorySlug(String categorySlug) {
    this.categorySlug = categorySlug;
  }

  public Category getCategory() {
    return category;
  }

  public void setCategory(Category category) {
    this.category = category;
    // Opcional: Sincroniza categoryName con el nombre de la categoría si category no es null
    this.categoryName = (category != null) ? category.getName() : this.categoryName;
    this.categorySlug = (category != null) ? category.getSlug() : this.categorySlug;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public LocalDate getPublishDate() {
    return publishDate;
  }

  public void setPublishDate(LocalDate publishDate) {
    this.publishDate = publishDate;
  }

  public ArticleStatus getStatus() {
    return status;
  }

  public void setStatus(ArticleStatus status) {
    this.status = status;
  }

  public String getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(String createdBy) {
    this.createdBy = createdBy;
  }

  public String getPromoVideo() {
    return promoVideo;
  }

  public void setPromoVideo(String promoVideo) {
    this.promoVideo = promoVideo;
  }

  public String getPromoVideoPublicId() {
    return promoVideoPublicId;
  }

  public void setPromoVideoPublicId(String promoVideoPublicId) {
    this.promoVideoPublicId = promoVideoPublicId;
  }

  public LocalDateTime getPromoVideoUploadDate() {
    return promoVideoUploadDate;
  }

  public void setPromoVideoUploadDate(LocalDateTime promoVideoUploadDate) {
    this.promoVideoUploadDate = promoVideoUploadDate;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
  }

  public List<ArticlePromotion> getPromotions() {
    return promotions;
  }

  public void setPromotions(List<ArticlePromotion> promotions) {
    this.promotions = promotions;
  }

  public List<ArticlePromotion> getActivePlans() {
    return activePlans;
  }

  public void setActivePlans(List<ArticlePromotion> activePlans) {
    this.activePlans = activePlans;
  }

}
