package com.promptbench.repository;

import com.promptbench.model.PromptLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromptLogRepository extends JpaRepository<PromptLog, Long> {
    List<PromptLog> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
