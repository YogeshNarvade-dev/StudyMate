package com.studymate.controller;

import com.studymate.dto.RatingRequest;
import com.studymate.dto.ResourceResponse;
import com.studymate.model.ResourceType;
import com.studymate.service.ResourceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@Validated
public class ResourceController {
    private final ResourceService service;
    public ResourceController(ResourceService service) { this.service = service; }

    @GetMapping
    public List<ResourceResponse> search(@RequestParam(required = false) String query,
        @RequestParam(required = false) String course, @RequestParam(required = false) String semester,
        @RequestParam(required = false) String subject, @RequestParam(required = false) String category,
        @RequestParam(required = false) ResourceType type, Authentication auth) {
        return service.search(query, course, semester, subject, category, type, auth);
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public List<ResourceResponse> mine(Authentication auth) { return service.myResources(auth); }

    @GetMapping("/bookmarks")
    @PreAuthorize("isAuthenticated()")
    public List<ResourceResponse> bookmarks(Authentication auth) { return service.myBookmarks(auth); }

    @GetMapping("/{id}")
    public ResourceResponse get(@PathVariable Long id, Authentication auth) {
        return service.get(id, auth);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResourceResponse> upload(
        @RequestPart(value = "file", required = false) MultipartFile file,
        @RequestParam @NotBlank @Size(max = 180) String title,
        @RequestParam(required = false) @Size(max = 1500) String description,
        @RequestParam @NotBlank @Size(max = 100) String course,
        @RequestParam @NotBlank @Size(max = 40) String semester,
        @RequestParam @NotBlank @Size(max = 120) String subject,
        @RequestParam @NotBlank @Size(max = 50) String category,
        @RequestParam(required = false) ResourceType type,
        @RequestParam(required = false) String externalUrl,
        Authentication auth) {
        ResourceResponse response = service.upload(file, title, description, course, semester,
            subject, category, type, externalUrl, auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        var entity = service.getEntity(id);
        Path path = service.getFile(entity);
        service.incrementDownload(entity);
        Resource file = new UrlResource(path.toUri());
        MediaType mediaType = MediaTypeFactory.getMediaType(entity.getOriginalFilename())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(entity.getOriginalFilename()).build().toString())
            .body(file);
    }

    @PostMapping("/{id}/bookmark")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> bookmark(@PathVariable Long id, Authentication auth) {
        service.bookmark(id, auth);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/bookmark")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeBookmark(@PathVariable Long id, Authentication auth) {
        service.removeBookmark(id, auth);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> rate(@PathVariable Long id, @Valid @RequestBody RatingRequest request,
            Authentication auth) {
        service.rate(id, request.rating(), auth);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeRating(@PathVariable Long id, Authentication auth) {
        service.removeRating(id, auth);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        boolean admin = auth.getAuthorities().stream().map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
        service.delete(id, auth, admin);
        return ResponseEntity.noContent().build();
    }
}
