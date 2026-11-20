package com.promptbench.repository;

import com.promptbench.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByUsername(String username);
    
    List<Session> findByProblemIdAndCompletedTrue(Long problemId);
    
    @Query("SELECT s FROM Session s WHERE s.problem.id = :problemId AND s.completed = true AND s.passRate = 100.0 ORDER BY (s.totalPromptTokens + s.totalCompletionTokens) ASC, TIMESTAMPDIFF(SECOND, s.startedAt, s.submittedAt) ASC")
    List<Session> findLeaderboardByProblem(@Param("problemId") Long problemId);
    
    @Query("SELECT s FROM Session s WHERE s.completed = true AND s.passRate = 100.0 ORDER BY (s.totalPromptTokens + s.totalCompletionTokens) ASC")
    List<Session> findGlobalLeaderboard();
}
