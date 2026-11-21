package com.studymate.dto;

import com.studymate.model.Resource;
import com.studymate.model.ResourceType;
import java.time.LocalDateTime;

public record ResourceResponse(
    Long id, String title, String description, String course, String semester,
    String subject, String category, ResourceType resourceType, String externalUrl,
    String originalFilename, long fileSize, boolean downloadAvailable,
    Long uploadedById, String uploadedByName, LocalDateTime uploadedAt, long downloadCount,
    double averageRating, long ratingCount, Integer myRating, boolean bookmarkedByMe
) {
    public static ResourceResponse from(Resource r, double averageRating, long ratingCount,
            Integer myRating, boolean bookmarkedByMe) {
        return new ResourceResponse(r.getId(), r.getTitle(), r.getDescription(), r.getCourse(),
            r.getSemester(), r.getSubject(), r.getCategory(), r.getResourceType(), r.getExternalUrl(),
            r.getOriginalFilename(), r.getFileSize(), r.getStoredFilename() != null && !r.getStoredFilename().isBlank(),
            r.getUploadedBy().getId(), r.getUploadedBy().getName(), r.getUploadedAt(),
            r.getDownloadCount(), averageRating, ratingCount, myRating, bookmarkedByMe);
    }
}
