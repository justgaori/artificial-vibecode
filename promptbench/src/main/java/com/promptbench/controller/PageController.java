package com.promptbench.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {
    
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
    
    @GetMapping("/solve")
    public String solve() {
        return "forward:/solve.html";
    }
    
    @GetMapping("/result")
    public String result() {
        return "forward:/result.html";
    }
    
    @GetMapping("/leaderboard")
    public String leaderboard() {
        return "forward:/leaderboard.html";
    }
}
