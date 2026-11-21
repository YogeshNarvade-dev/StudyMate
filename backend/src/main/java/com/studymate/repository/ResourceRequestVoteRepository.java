package com.studymate.repository;

import com.studymate.model.ResourceRequestVote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRequestVoteRepository extends JpaRepository<ResourceRequestVote, Long> {
    boolean existsByRequest_IdAndUser_Id(Long requestId, Long userId);
    long countByRequest_Id(Long requestId);
    void deleteByRequest_IdAndUser_Id(Long requestId, Long userId);
}
