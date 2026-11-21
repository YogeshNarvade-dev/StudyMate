package com.studymate.service;

import com.studymate.dto.ResourceRequestDtos.CreateRequest;
import com.studymate.dto.ResourceRequestDtos.ResourceRequestResponse;
import com.studymate.model.ResourceRequest;
import com.studymate.model.ResourceRequestStatus;
import com.studymate.model.ResourceRequestVote;
import com.studymate.model.User;
import com.studymate.repository.ResourceRequestRepository;
import com.studymate.repository.ResourceRequestVoteRepository;
import com.studymate.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ResourceRequestService {
    private final ResourceRequestRepository requests;
    private final ResourceRequestVoteRepository votes;
    private final UserRepository users;

    public ResourceRequestService(ResourceRequestRepository requests,
            ResourceRequestVoteRepository votes, UserRepository users) {
        this.requests = requests;
        this.votes = votes;
        this.users = users;
    }

    public List<ResourceRequestResponse> list(String query, Authentication auth) {
        User viewer = findUser(auth);
        String term = query == null ? "" : query.trim().toLowerCase();
        return requests.findAllByOrderByCreatedAtDesc().stream()
            .filter(request -> term.isEmpty() || searchable(request).contains(term))
            .map(request -> toResponse(request, viewer))
            .sorted(Comparator.comparingLong(ResourceRequestResponse::upvoteCount).reversed()
                .thenComparing(ResourceRequestResponse::createdAt, Comparator.reverseOrder()))
            .toList();
    }

    @Transactional
    public ResourceRequestResponse create(CreateRequest input, Authentication auth) {
        User user = requireUser(auth);
        ResourceRequest request = new ResourceRequest(input.title().trim(), blankToNull(input.description()),
            input.course().trim(), blankToNull(input.semester()), input.subject().trim(), user);
        return toResponse(requests.save(request), user);
    }

    @Transactional
    public void upvote(Long id, Authentication auth) {
        User user = requireUser(auth);
        ResourceRequest request = get(id);
        if (!votes.existsByRequest_IdAndUser_Id(id, user.getId()))
            votes.save(new ResourceRequestVote(request, user));
    }

    @Transactional
    public void removeUpvote(Long id, Authentication auth) {
        User user = requireUser(auth);
        get(id);
        votes.deleteByRequest_IdAndUser_Id(id, user.getId());
    }

    @Transactional
    public void updateStatus(Long id, ResourceRequestStatus status) {
        if (status == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a request status");
        ResourceRequest request = get(id);
        request.setStatus(status);
        requests.save(request);
    }

    private ResourceRequest get(Long id) {
        return requests.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource request not found"));
    }

    private ResourceRequestResponse toResponse(ResourceRequest request, User viewer) {
        long count = votes.countByRequest_Id(request.getId());
        boolean voted = viewer != null && votes.existsByRequest_IdAndUser_Id(request.getId(), viewer.getId());
        return ResourceRequestResponse.from(request, count, voted);
    }

    private User requireUser(Authentication auth) {
        User user = findUser(auth);
        if (user == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        return user;
    }

    private User findUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        return users.findByEmailIgnoreCase(auth.getName()).orElse(null);
    }

    private static String searchable(ResourceRequest request) {
        return String.join(" ", request.getTitle(), request.getDescription() == null ? "" : request.getDescription(),
            request.getCourse(), request.getSubject(), request.getSemester() == null ? "" : request.getSemester())
            .toLowerCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
