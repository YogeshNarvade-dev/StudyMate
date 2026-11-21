package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_ratings", uniqueConstraints =
    @UniqueConstraint(columnNames = {"resource_id", "user_id"}))
public class ResourceRating {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id", nullable = false)
    private Resource resource;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false)
    private int rating;
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    protected ResourceRating() {}
    public ResourceRating(Resource resource, User user, int rating) {
        this.resource = resource;
        this.user = user;
        this.rating = rating;
    }
    public Long getId() { return id; }
    public Resource getResource() { return resource; }
    public User getUser() { return user; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; this.updatedAt = LocalDateTime.now(); }
}
