package com.studymate.repository;

import com.studymate.model.ResourceRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ResourceRatingRepository extends JpaRepository<ResourceRating, Long> {
    Optional<ResourceRating> findByResource_IdAndUser_Id(Long resourceId, Long userId);
    long countByResource_Id(Long resourceId);
    @Query("select coalesce(avg(r.rating), 0) from ResourceRating r where r.resource.id = :resourceId")
    Double averageForResource(@Param("resourceId") Long resourceId);
    void deleteByResource_IdAndUser_Id(Long resourceId, Long userId);
    void deleteByResource_Id(Long resourceId);
}
