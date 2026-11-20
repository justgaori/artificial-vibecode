package com.promptbench.integration;

import com.promptbench.dto.ChatResponse;
import com.promptbench.dto.GradeResult;
import com.promptbench.dto.SessionReport;
import com.promptbench.model.Problem;
import com.promptbench.model.Session;
import com.promptbench.repository.ProblemRepository;
import com.promptbench.service.LlmService;
import com.promptbench.service.ProblemService;
import com.promptbench.service.SessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SessionFlowIntegrationTest {
    
    @Autowired
    private SessionService sessionService;
    
    @Autowired
    private ProblemService problemService;
    
    @Autowired
    private ProblemRepository problemRepository;
    
    @Autowired
    private LlmService llmService;
    
    private Problem testProblem;
    
    @BeforeEach
    void setUp() {
        List<Problem> problems = problemService.getAllProblems();
        if (!problems.isEmpty()) {
            testProblem = problems.get(0);
        } else {
            testProblem = new Problem();
            testProblem.setTitle("테스트 문제");
            testProblem.setDescription("테스트 설명");
            testProblem.setDifficulty("쉬움");
            testProblem.setCategory("테스트");
            testProblem.setTestCases("[{\"input\":\"1\",\"expected\":\"1\"}]");
            testProblem.setReferenceSolution("function test(x) { return x; }");
            testProblem.setTemplateCode("function test(x) { }");
            testProblem.setMock(true);
            testProblem = problemRepository.save(testProblem);
        }
    }
    
    @Test
    @DisplayName("모의 모드에서 세션 전체 흐름이 동작해야 함")
    void fullSessionFlow_inMockMode() {
        assertTrue(llmService.isMockMode(), "API 키 없이 모의 모드여야 함");
        
        Session session = sessionService.startSession("테스트유저", testProblem.getId());
        assertNotNull(session);
        assertNotNull(session.getId());
        assertEquals("테스트유저", session.getUsername());
        assertTrue(session.isMockSession());
        assertEquals(0, session.getPromptCount());
        assertEquals(0, session.getTotalPromptTokens());
        
        ChatResponse response1 = sessionService.processChat(session.getId(), "힌트를 주세요");
        assertNotNull(response1);
        assertTrue(response1.isMock());
        assertTrue(response1.getMessage().contains("[모의 데이터]"));
        assertNotNull(response1.getPromptTokens());
        assertNotNull(response1.getCompletionTokens());
        assertTrue(response1.getPromptTokens() > 0);
        assertTrue(response1.getCompletionTokens() > 0);
        assertEquals(1, response1.getPromptCount());
        
        ChatResponse response2 = sessionService.processChat(session.getId(), "도움이 필요해요");
        assertEquals(2, response2.getPromptCount());
        assertTrue(response2.getTotalSessionTokens() > response1.getTotalSessionTokens());
        
        GradeResult gradeResult = new GradeResult();
        gradeResult.setPassed(1);
        gradeResult.setTotal(1);
        gradeResult.setPassRate(100.0);
        gradeResult.setTestResults(new ArrayList<>());
        
        Session completedSession = sessionService.submitCode(
            session.getId(), 
            "function test(x) { return x; }", 
            gradeResult
        );
        
        assertTrue(completedSession.isCompleted());
        assertNotNull(completedSession.getSubmittedAt());
        assertEquals(100.0, completedSession.getPassRate());
        
        SessionReport report = sessionService.generateReport(session.getId());
        assertNotNull(report);
        assertEquals(session.getId(), report.getSessionId());
        assertEquals("테스트유저", report.getUsername());
        assertEquals(2, report.getPromptCount());
        assertTrue(report.getTotalTokens() > 0);
        assertTrue(report.isMockSession());
        assertNotNull(report.getTimeline());
        assertEquals(2, report.getTimeline().size());
    }
    
    @Test
    @DisplayName("프록시에서 토큰 수가 정확히 기록되어야 함")
    void tokenRecording_shouldBeAccurate() {
        Session session = sessionService.startSession("토큰테스트", testProblem.getId());
        
        int totalPromptTokens = 0;
        int totalCompletionTokens = 0;
        
        for (int i = 0; i < 3; i++) {
            ChatResponse response = sessionService.processChat(session.getId(), "질문 " + i);
            totalPromptTokens += response.getPromptTokens();
            totalCompletionTokens += response.getCompletionTokens();
        }
        
        SessionReport report = sessionService.generateReport(session.getId());
        
        assertEquals(totalPromptTokens, report.getTotalPromptTokens(),
            "입력 토큰 합계가 일치해야 함");
        assertEquals(totalCompletionTokens, report.getTotalCompletionTokens(),
            "출력 토큰 합계가 일치해야 함");
        assertEquals(totalPromptTokens + totalCompletionTokens, report.getTotalTokens(),
            "총 토큰이 입력+출력 합계와 일치해야 함");
        assertEquals(3, report.getPromptCount());
    }
    
    @Test
    @DisplayName("완료된 세션에서는 채팅이 불가능해야 함")
    void completedSession_shouldNotAllowChat() {
        Session session = sessionService.startSession("완료테스트", testProblem.getId());
        
        GradeResult gradeResult = new GradeResult();
        gradeResult.setPassed(1);
        gradeResult.setTotal(1);
        gradeResult.setPassRate(100.0);
        gradeResult.setTestResults(new ArrayList<>());
        
        sessionService.submitCode(session.getId(), "code", gradeResult);
        
        assertThrows(RuntimeException.class, () -> {
            sessionService.processChat(session.getId(), "더 질문하기");
        });
    }
    
    @Test
    @DisplayName("리더보드가 토큰 순으로 정렬되어야 함")
    void leaderboard_shouldSortByTokens() {
        Session session1 = sessionService.startSession("유저1", testProblem.getId());
        for (int i = 0; i < 5; i++) {
            sessionService.processChat(session1.getId(), "긴 질문입니다 ".repeat(10));
        }
        
        Session session2 = sessionService.startSession("유저2", testProblem.getId());
        sessionService.processChat(session2.getId(), "짧은 질문");
        
        GradeResult gradeResult = new GradeResult();
        gradeResult.setPassed(1);
        gradeResult.setTotal(1);
        gradeResult.setPassRate(100.0);
        gradeResult.setTestResults(new ArrayList<>());
        
        sessionService.submitCode(session1.getId(), "code", gradeResult);
        sessionService.submitCode(session2.getId(), "code", gradeResult);
        
        var leaderboard = sessionService.getLeaderboard(testProblem.getId());
        
        assertFalse(leaderboard.isEmpty());
        if (leaderboard.size() >= 2) {
            assertTrue(leaderboard.get(0).getTotalTokens() <= leaderboard.get(1).getTotalTokens(),
                "리더보드는 토큰 오름차순이어야 함");
        }
    }
}
