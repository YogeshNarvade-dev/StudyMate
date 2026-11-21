package com.studymate.dto;

import com.studymate.model.ResourceRequest;
import com.studymate.model.ResourceRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class ResourceRequestDtos {
    public record CreateRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 1500) String description,
        @NotBlank @Size(max = 100) String course,
        @Size(max = 40) String semester,
        @NotBlank @Size(max = 120) String subject
    ) {}

    public record StatusUpdate(@NotNull ResourceRequestStatus status) {}

    public record ResourceRequestResponse(
        Long id, String title, String description, String course, String semester,
        String subject, ResourceRequestStatus status, Long requestedById,
        String requestedByName, LocalDateTime createdAt, long upvoteCount, boolean upvotedByMe
    ) {
        public static ResourceRequestResponse from(ResourceRequest request, long votes, boolean upvoted) {
            return new ResourceRequestResponse(request.getId(), request.getTitle(),
                request.getDescription(), request.getCourse(), request.getSemester(),
                request.getSubject(), request.getStatus(), request.getRequestedBy().getId(),
                request.getRequestedBy().getName(), request.getCreatedAt(), votes, upvoted);
        }
    }
}
