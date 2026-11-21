package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_bookmarks", uniqueConstraints =
    @UniqueConstraint(columnNames = {"resource_id", "user_id"}))
public class ResourceBookmark {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected ResourceBookmark() {}
    public ResourceBookmark(Resource resource, User user) {
        this.resource = resource;
        this.user = user;
    }
    public Long getId() { return id; }
    public Resource getResource() { return resource; }
    public User getUser() { return user; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
