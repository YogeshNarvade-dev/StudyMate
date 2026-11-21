package com.studymate.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_request_votes", uniqueConstraints =
    @UniqueConstraint(columnNames = {"request_id", "user_id"}))
public class ResourceRequestVote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private ResourceRequest request;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected ResourceRequestVote() {}
    public ResourceRequestVote(ResourceRequest request, User user) {
        this.request = request;
        this.user = user;
    }
}
