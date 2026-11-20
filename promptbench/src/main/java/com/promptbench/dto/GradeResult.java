package com.promptbench.dto;

import java.util.List;

public class GradeResult {
    
    private int passed;
    private int total;
    private double passRate;
    private List<TestCaseResult> testResults;
    
    public int getPassed() { return passed; }
    public void setPassed(int passed) { this.passed = passed; }
    
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    
    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }
    
    public List<TestCaseResult> getTestResults() { return testResults; }
    public void setTestResults(List<TestCaseResult> testResults) { this.testResults = testResults; }
    
    public static class TestCaseResult {
        private int index;
        private boolean passed;
        private String input;
        private String expected;
        private String actual;
        private String error;
        
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }
        
        public boolean isPassed() { return passed; }
        public void setPassed(boolean passed) { this.passed = passed; }
        
        public String getInput() { return input; }
        public void setInput(String input) { this.input = input; }
        
        public String getExpected() { return expected; }
        public void setExpected(String expected) { this.expected = expected; }
        
        public String getActual() { return actual; }
        public void setActual(String actual) { this.actual = actual; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
