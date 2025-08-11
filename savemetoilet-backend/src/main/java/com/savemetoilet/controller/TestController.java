package com.savemetoilet.controller;

import com.savemetoilet.dto.SeoulApiResponse;
import com.savemetoilet.service.SeoulApiClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API 테스트를 위한 컨트롤러
 * 서울시 API 연동 테스트 및 기본 기능 확인용
 */
@RestController
@RequestMapping("/api/v1/test")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TestController {

    private final SeoulApiClient seoulApiClient;

    @Autowired
    public TestController(SeoulApiClient seoulApiClient) {
        this.seoulApiClient = seoulApiClient;
    }

    /**
     * 서울시 API 연결 테스트
     */
    @GetMapping("/connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new HashMap<>();
        
        boolean isConnected = seoulApiClient.testConnection();
        
        response.put("success", isConnected);
        response.put("message", isConnected ? "서울시 API 연결 성공" : "서울시 API 연결 실패");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 화장실 데이터 샘플 조회 (처음 N개)
     */
    @GetMapping("/toilets/sample")
    public ResponseEntity<Map<String, Object>> getSampleToilets(
            @RequestParam(defaultValue = "10") int limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<SeoulApiResponse.ToiletData> allToilets = seoulApiClient.getAllToilets();
            
            // 요청된 개수만큼 제한
            List<SeoulApiResponse.ToiletData> sampleToilets = allToilets.stream()
                    .limit(limit)
                    .toList();
            
            response.put("success", true);
            response.put("total_count", allToilets.size());
            response.put("sample_count", sampleToilets.size());
            response.put("toilets", sampleToilets);
            response.put("message", "화장실 데이터 샘플 조회 성공");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "화장실 데이터 조회 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 전체 화장실 개수 조회
     */
    @GetMapping("/toilets/count")
    public ResponseEntity<Map<String, Object>> getToiletCount() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<SeoulApiResponse.ToiletData> allToilets = seoulApiClient.getAllToilets();
            
            response.put("success", true);
            response.put("total_count", allToilets.size());
            response.put("message", "화장실 개수 조회 성공");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "화장실 개수 조회 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 서버 상태 확인
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("status", "UP");
        response.put("message", "SaveMeToilet Backend is running");
        response.put("timestamp", System.currentTimeMillis());
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }
}