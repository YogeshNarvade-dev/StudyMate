package com.studymate.service;

import com.studymate.dto.ResourceResponse;
import com.studymate.model.*;
import com.studymate.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ResourceService {
    private static final Map<String, String> ALLOWED_FILE_TYPES = Map.of(
        ".pdf", "application/pdf",
        ".ppt", "application/vnd.ms-powerpoint",
        ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".doc", "application/msword",
        ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".epub", "application/epub+zip"
    );

    private final ResourceRepository resources;
    private final UserRepository users;
    private final ResourceBookmarkRepository bookmarks;
    private final ResourceRatingRepository ratings;
    private final DocumentTextExtractor textExtractor;
    private final Path uploadPath;
    private final long maxFileSize;

    public ResourceService(ResourceRepository resources, UserRepository users,
            ResourceBookmarkRepository bookmarks, ResourceRatingRepository ratings,
            DocumentTextExtractor textExtractor,
            @Value("${app.upload.dir}") String uploadDir,
            @Value("${app.upload.max-file-size}") long maxFileSize) throws IOException {
        this.resources = resources;
        this.users = users;
        this.bookmarks = bookmarks;
        this.ratings = ratings;
        this.textExtractor = textExtractor;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        Files.createDirectories(this.uploadPath);
    }

    public List<ResourceResponse> search(String query, String course, String semester,
            String subject, String category, ResourceType type, Authentication auth) {
        Specification<Resource> spec = (root, q, cb) -> cb.conjunction();
        if (query != null && !query.isBlank()) {
            String term = "%" + escapeLike(query.trim().toLowerCase(Locale.ROOT)) + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), term, '\\'),
                cb.like(cb.lower(root.get("description")), term, '\\'),
                cb.like(cb.lower(root.get("subject")), term, '\\'),
                cb.like(cb.lower(root.get("course")), term, '\\')));
        }
        if (course != null && !course.isBlank())
            spec = spec.and((r, q, cb) -> cb.equal(cb.lower(r.get("course")), course.trim().toLowerCase(Locale.ROOT)));
        if (semester != null && !semester.isBlank())
            spec = spec.and((r, q, cb) -> cb.equal(cb.lower(r.get("semester")), semester.trim().toLowerCase(Locale.ROOT)));
        if (subject != null && !subject.isBlank())
            spec = spec.and((r, q, cb) -> cb.equal(cb.lower(r.get("subject")), subject.trim().toLowerCase(Locale.ROOT)));
        if (category != null && !category.isBlank())
            spec = spec.and((r, q, cb) -> cb.equal(cb.lower(r.get("category")), category.trim().toLowerCase(Locale.ROOT)));
        if (type != null)
            spec = spec.and((r, q, cb) -> cb.equal(r.get("resourceType"), type));
        return resources.findAll(spec, Sort.by(Sort.Direction.DESC, "uploadedAt"))
            .stream().map(resource -> toResponse(resource, auth)).toList();
    }

    public List<ResourceResponse> myResources(Authentication auth) {
        User user = currentUser(auth);
        return resources.findAll((root, query, cb) -> cb.equal(root.get("uploadedBy"), user),
            Sort.by(Sort.Direction.DESC, "uploadedAt"))
            .stream().map(resource -> toResponse(resource, auth)).toList();
    }

    public List<ResourceResponse> myBookmarks(Authentication auth) {
        User user = currentUser(auth);
        return bookmarks.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
            .map(bookmark -> toResponse(bookmark.getResource(), auth)).toList();
    }

    @Transactional
    public ResourceResponse upload(MultipartFile file, String title, String description,
            String course, String semester, String subject, String category, ResourceType type,
            String externalUrl, Authentication auth) {
        ResourceType resourceType = type == null ? ResourceType.PDF : type;
        boolean externalVideo = resourceType == ResourceType.EXTERNAL_VIDEO;
        if (externalVideo) {
            if (file != null && !file.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "External video resources use a link, not an uploaded video file");
            validateExternalUrl(externalUrl);
        } else {
            if (file == null || file.isEmpty())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a study file to upload");
            if (externalUrl != null && !externalUrl.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only external video resources can use a link");
            if (file.getSize() > maxFileSize)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds the size limit");
        }

        User user = currentUser(auth);
        Resource resource = new Resource();
        resource.setTitle(title.trim());
        resource.setDescription(blankToNull(description));
        resource.setCourse(course.trim());
        resource.setSemester(semester.trim());
        resource.setSubject(subject.trim());
        resource.setCategory(category.trim());
        resource.setResourceType(resourceType);
        resource.setUploadedBy(user);

        Path destination = null;
        if (externalVideo) {
            resource.setExternalUrl(externalUrl.trim());
            // Keep compatibility with existing NOT NULL file columns in databases created by earlier versions.
            resource.setStoredFilename("");
            resource.setOriginalFilename("External link");
            resource.setFileSize(0);
        } else {
            String original = safeOriginalFilename(file.getOriginalFilename());
            String extension = extensionOf(original);
            String expectedType = ALLOWED_FILE_TYPES.get(extension);
            if (expectedType == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Supported files: PDF, PowerPoint, Word and EPUB");
            String contentType = file.getContentType();
            if (contentType != null && !contentType.isBlank()
                    && !contentType.equalsIgnoreCase(expectedType)
                    && !contentType.equalsIgnoreCase("application/octet-stream"))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The file type does not match its filename");

            String stored = UUID.randomUUID() + extension;
            destination = uploadPath.resolve(stored).normalize();
            if (!destination.startsWith(uploadPath))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid filename");
            try {
                file.transferTo(destination);
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save file");
            }
            resource.setStoredFilename(stored);
            resource.setOriginalFilename(original);
            resource.setFileSize(file.getSize());
            resource.setExtractedText(textExtractor.extract(destination));
        }

        try {
            return toResponse(resources.save(resource), auth);
        } catch (RuntimeException ex) {
            if (destination != null) {
                try { Files.deleteIfExists(destination); } catch (IOException ignored) {}
            }
            throw ex;
        }
    }

    public Resource getEntity(Long id) {
        return resources.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    public ResourceResponse get(Long id, Authentication auth) {
        return toResponse(getEntity(id), auth);
    }

    public Path getFile(Resource resource) {
        if (resource.getStoredFilename() == null || resource.getStoredFilename().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This resource opens through an external link");
        Path path = uploadPath.resolve(resource.getStoredFilename()).normalize();
        if (!path.startsWith(uploadPath) || !Files.exists(path))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        return path;
    }

    @Transactional
    public void incrementDownload(Resource resource) {
        resource.incrementDownloadCount();
        resources.save(resource);
    }

    @Transactional
    public void delete(Long id, Authentication auth, boolean admin) {
        Resource resource = getEntity(id);
        if (!admin && !resource.getUploadedBy().getEmail().equalsIgnoreCase(auth.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can delete only your own resources");
        Path file = resource.getStoredFilename() == null || resource.getStoredFilename().isBlank()
            ? null : uploadPath.resolve(resource.getStoredFilename()).normalize();
        bookmarks.deleteByResource_Id(id);
        ratings.deleteByResource_Id(id);
        resources.delete(resource);
        if (file != null && file.startsWith(uploadPath)) {
            try { Files.deleteIfExists(file); } catch (IOException ignored) {}
        }
    }

    @Transactional
    public void bookmark(Long id, Authentication auth) {
        Resource resource = getEntity(id);
        User user = currentUser(auth);
        if (!bookmarks.existsByResource_IdAndUser_Id(id, user.getId()))
            bookmarks.save(new ResourceBookmark(resource, user));
    }

    @Transactional
    public void removeBookmark(Long id, Authentication auth) {
        currentUser(auth);
        bookmarks.deleteByResource_IdAndUser_Id(id, userId(auth));
    }

    @Transactional
    public void rate(Long id, int value, Authentication auth) {
        if (value < 1 || value > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        Resource resource = getEntity(id);
        User user = currentUser(auth);
        ResourceRating rating = ratings.findByResource_IdAndUser_Id(id, user.getId())
            .orElseGet(() -> new ResourceRating(resource, user, value));
        rating.setRating(value);
        ratings.save(rating);
    }

    @Transactional
    public void removeRating(Long id, Authentication auth) {
        currentUser(auth);
        ratings.deleteByResource_IdAndUser_Id(id, userId(auth));
    }

    public long count() { return resources.count(); }
    public long countUsers() { return users.count(); }

    private ResourceResponse toResponse(Resource resource, Authentication auth) {
        User viewer = auth == null || auth.getName() == null ? null
            : users.findByEmailIgnoreCase(auth.getName()).orElse(null);
        long ratingCount = ratings.countByResource_Id(resource.getId());
        double averageRating = Optional.ofNullable(ratings.averageForResource(resource.getId())).orElse(0.0);
        Integer myRating = viewer == null ? null : ratings
            .findByResource_IdAndUser_Id(resource.getId(), viewer.getId())
            .map(ResourceRating::getRating).orElse(null);
        boolean isBookmarked = viewer != null
            && bookmarks.existsByResource_IdAndUser_Id(resource.getId(), viewer.getId());
        return ResourceResponse.from(resource, averageRating, ratingCount, myRating, isBookmarked);
    }

    private User currentUser(Authentication auth) {
        if (auth == null || auth.getName() == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        return users.findByEmailIgnoreCase(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Long userId(Authentication auth) { return currentUser(auth).getId(); }

    private static String safeOriginalFilename(String filename) {
        String value = Objects.requireNonNullElse(filename, "study-material.pdf").replace('\\', '/');
        int slash = value.lastIndexOf('/');
        return slash >= 0 ? value.substring(slash + 1) : value;
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot).toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static void validateExternalUrl(String value) {
        if (value == null || value.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add the public video link");
        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme();
            if (uri.getHost() == null || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)))
                throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add a valid http or https link");
        }
    }
}
