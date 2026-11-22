package com.studymate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AssistantDtos {
    private AssistantDtos() {}

    public record ChatTurn(
        @NotBlank @Size(max = 1000) String role,
        @NotBlank @Size(max = 4000) String content
    ) {}

    public record Question(
        @NotBlank @Size(max = 1000) String question,
        @Size(max = 8) List<@Valid ChatTurn> history
    ) {}

    public record Citation(
        String sourceId,
        Long resourceId,
        String title,
        String course,
        String subject,
        String originalFilename,
        String excerpt
    ) {}

    public record Answer(String answer, List<Citation> sources) {}
}
