package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_requests")
public class ResourceRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(length = 1500)
    private String description;
    @Column(nullable = false, length = 100)
    private String course;
    @Column(length = 40)
    private String semester;
    @Column(nullable = false, length = 120)
    private String subject;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ResourceRequestStatus status = ResourceRequestStatus.OPEN;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    protected ResourceRequest() {}
    public ResourceRequest(String title, String description, String course, String semester,
            String subject, User requestedBy) {
        this.title = title;
        this.description = description;
        this.course = course;
        this.semester = semester;
        this.subject = subject;
        this.requestedBy = requestedBy;
    }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCourse() { return course; }
    public String getSemester() { return semester; }
    public String getSubject() { return subject; }
    public ResourceRequestStatus getStatus() { return status; }
    public User getRequestedBy() { return requestedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setStatus(ResourceRequestStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
}
