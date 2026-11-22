package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resources")
public class Resource {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(length = 1500)
    private String description;
    @Column(nullable = false, length = 100)
    private String course;
    @Column(nullable = false, length = 40)
    private String semester;
    @Column(nullable = false, length = 120)
    private String subject;
    @Column(nullable = false, length = 50)
    private String category;
    @Column
    private String storedFilename;
    @Column
    private String originalFilename;
    @Column(nullable = false)
    private long fileSize;
    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 32,
        columnDefinition = "varchar(32) default 'PDF'")
    private ResourceType resourceType = ResourceType.PDF;
    @Column(length = 1200)
    private String externalUrl;
    @Column(name = "extracted_text", columnDefinition = "MEDIUMTEXT")
    private String extractedText;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;
    @Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
    private long downloadCount = 0;

    public Resource() {}
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCourse() { return course; }
    public String getSemester() { return semester; }
    public String getSubject() { return subject; }
    public String getCategory() { return category; }
    public String getStoredFilename() { return storedFilename; }
    public String getOriginalFilename() { return originalFilename; }
    public long getFileSize() { return fileSize; }
    public ResourceType getResourceType() { return resourceType; }
    public String getExternalUrl() { return externalUrl; }
    public String getExtractedText() { return extractedText; }
    public User getUploadedBy() { return uploadedBy; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public long getDownloadCount() { return downloadCount; }
    public void setTitle(String v) { title = v; }
    public void setDescription(String v) { description = v; }
    public void setCourse(String v) { course = v; }
    public void setSemester(String v) { semester = v; }
    public void setSubject(String v) { subject = v; }
    public void setCategory(String v) { category = v; }
    public void setStoredFilename(String v) { storedFilename = v; }
    public void setOriginalFilename(String v) { originalFilename = v; }
    public void setFileSize(long v) { fileSize = v; }
    public void setResourceType(ResourceType v) { resourceType = v; }
    public void setExternalUrl(String v) { externalUrl = v; }
    public void setExtractedText(String v) { extractedText = v; }
    public void setUploadedBy(User v) { uploadedBy = v; }
    public void setUploadedAt(LocalDateTime v) { uploadedAt = v; }
    public void incrementDownloadCount() { downloadCount++; }
}
