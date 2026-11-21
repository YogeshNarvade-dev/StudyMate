package com.studymate.repository;

import com.studymate.model.ResourceBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceBookmarkRepository extends JpaRepository<ResourceBookmark, Long> {
    boolean existsByResource_IdAndUser_Id(Long resourceId, Long userId);
    List<ResourceBookmark> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
    void deleteByResource_IdAndUser_Id(Long resourceId, Long userId);
    void deleteByResource_Id(Long resourceId);
}
