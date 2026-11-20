package com.promptbench.service;

import com.promptbench.dto.ChatResponse;
import com.promptbench.model.Problem;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MockLlmServiceTest {
    
    private final MockLlmService mockLlmService = new MockLlmService();
    
    @Test
    @DisplayName("모의 문제 목록이 올바르게 생성되어야 함")
    void getMockProblems_shouldReturnProblemList() {
        List<Problem> problems = mockLlmService.getMockProblems();
        
        assertNotNull(problems);
        assertFalse(problems.isEmpty());
        assertEquals(3, problems.size());
        
        Problem first = problems.get(0);
        assertEquals("배열 합계 계산", first.getTitle());
        assertEquals("쉬움", first.getDifficulty());
        assertTrue(first.isMock());
        assertNotNull(first.getTestCases());
        assertNotNull(first.getReferenceSolution());
    }
    
    @Test
    @DisplayName("모의 응답이 토큰 수를 포함해야 함")
    void generateMockResponse_shouldIncludeTokenCounts() {
        ChatResponse response = mockLlmService.generateMockResponse("힌트를 주세요");
        
        assertNotNull(response);
        assertNotNull(response.getMessage());
        assertTrue(response.getMessage().startsWith("[모의 데이터]"));
        assertTrue(response.isMock());
        
        assertNotNull(response.getPromptTokens());
        assertNotNull(response.getCompletionTokens());
        assertTrue(response.getPromptTokens() > 0);
        assertTrue(response.getCompletionTokens() > 0);
        
        assertNotNull(response.getResponseTimeMs());
        assertTrue(response.getResponseTimeMs() >= 200);
        
        assertEquals(0.0, response.getCost());
    }
    
    @Test
    @DisplayName("키워드에 따라 적절한 응답이 생성되어야 함")
    void generateMockResponse_shouldRespondToKeywords() {
        ChatResponse hintResponse = mockLlmService.generateMockResponse("힌트 주세요");
        assertTrue(hintResponse.getMessage().contains("모의 데이터"));
        
        ChatResponse helpResponse = mockLlmService.generateMockResponse("도움이 필요해요");
        assertTrue(helpResponse.getMessage().contains("모의 데이터"));
        
        ChatResponse exampleResponse = mockLlmService.generateMockResponse("예시 보여주세요");
        assertTrue(exampleResponse.getMessage().contains("모의 데이터"));
    }
    
    @Test
    @DisplayName("토큰 수 추정이 합리적이어야 함")
    void generateMockResponse_tokenEstimation() {
        String shortMessage = "안녕";
        String longMessage = "이것은 매우 긴 메시지입니다. 토큰 추정 테스트를 위해 작성했습니다. 충분히 길어야 합니다.";
        
        ChatResponse shortResponse = mockLlmService.generateMockResponse(shortMessage);
        ChatResponse longResponse = mockLlmService.generateMockResponse(longMessage);
        
        assertTrue(longResponse.getPromptTokens() > shortResponse.getPromptTokens(),
            "긴 메시지는 더 많은 프롬프트 토큰을 가져야 함");
    }
}
