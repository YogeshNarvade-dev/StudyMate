package com.studymate.repository;

import com.studymate.model.ResourceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceRequestRepository extends JpaRepository<ResourceRequest, Long> {
    List<ResourceRequest> findAllByOrderByCreatedAtDesc();
}
