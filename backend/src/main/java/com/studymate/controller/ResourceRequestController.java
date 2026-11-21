package com.studymate.controller;

import com.studymate.dto.ResourceRequestDtos.CreateRequest;
import com.studymate.dto.ResourceRequestDtos.ResourceRequestResponse;
import com.studymate.dto.ResourceRequestDtos.StatusUpdate;
import com.studymate.service.ResourceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-requests")
public class ResourceRequestController {
    private final ResourceRequestService service;
    public ResourceRequestController(ResourceRequestService service) { this.service = service; }

    @GetMapping
    public List<ResourceRequestResponse> list(@RequestParam(required = false) String query,
            Authentication auth) {
        return service.list(query, auth);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceRequestResponse> create(@Valid @RequestBody CreateRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, auth));
    }

    @PutMapping("/{id}/upvote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> upvote(@PathVariable Long id, Authentication auth) {
        service.upvote(id, auth);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/upvote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeUpvote(@PathVariable Long id, Authentication auth) {
        service.removeUpvote(id, auth);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id,
            @Valid @RequestBody StatusUpdate status) {
        service.updateStatus(id, status.status());
        return ResponseEntity.noContent().build();
    }
}
