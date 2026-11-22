package com.studymate.controller;

import com.studymate.dto.AssistantDtos.Answer;
import com.studymate.dto.AssistantDtos.Question;
import com.studymate.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) { this.assistant = assistant; }

    @PostMapping("/ask")
    @PreAuthorize("isAuthenticated()")
    public Answer ask(@Valid @RequestBody Question request) {
        return assistant.ask(request);
    }
}
