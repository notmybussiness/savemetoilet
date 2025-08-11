package com.savemetoilet.service;

import com.savemetoilet.dto.SeoulApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Seoul Open Data API Client
 * 서울시 공공데이터 API와의 통신을 담당하는 클라이언트
 */
@Service
public class SeoulApiClient {

    private static final Logger logger = LoggerFactory.getLogger(SeoulApiClient.class);
    private static final int MAX_RECORDS_PER_REQUEST = 1000;
    
    private final WebClient webClient;
    private final String apiKey;
    private final String baseUrl;
    private final String toiletService;

    public SeoulApiClient(
            @Value("${seoul.api.key}") String apiKey,
            @Value("${seoul.api.base-url}") String baseUrl,
            @Value("${seoul.api.toilet-service}") String toiletService,
            @Value("${seoul.api.timeout:30s}") Duration timeout) {
        
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.toiletService = toiletService;
        
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(5 * 1024 * 1024)) // 5MB
                .build();
                
        logger.info("Seoul API Client initialized with base URL: {}", baseUrl);
    }

    /**
     * 모든 공중화장실 데이터를 조회합니다.
     * 
     * @return 모든 화장실 데이터 리스트
     */
    public List<SeoulApiResponse.ToiletData> getAllToilets() {
        logger.info("서울시 공중화장실 전체 데이터 조회 시작");
        
        try {
            // 1단계: 전체 개수 확인
            SeoulApiResponse firstResponse = fetchToiletData(1, 1)
                    .block(Duration.ofSeconds(30));
            
            if (firstResponse == null || 
                firstResponse.getSearchPublicToiletPOIService() == null) {
                logger.error("API 응답이 null입니다.");
                return new ArrayList<>();
            }
            
            int totalCount = firstResponse.getSearchPublicToiletPOIService().getListTotalCount();
            logger.info("총 화장실 개수: {}", totalCount);
            
            // 2단계: 전체 데이터 조회 (배치 처리)
            List<SeoulApiResponse.ToiletData> allToilets = new ArrayList<>();
            int currentIndex = 1;
            
            while (currentIndex <= totalCount) {
                int endIndex = Math.min(currentIndex + MAX_RECORDS_PER_REQUEST - 1, totalCount);
                
                logger.debug("배치 조회: {}-{} (총 {}개)", currentIndex, endIndex, totalCount);
                
                SeoulApiResponse response = fetchToiletData(currentIndex, endIndex)
                        .block(Duration.ofSeconds(30));
                
                if (response != null && 
                    response.getSearchPublicToiletPOIService() != null &&
                    response.getSearchPublicToiletPOIService().getToilets() != null) {
                    
                    List<SeoulApiResponse.ToiletData> batchToilets = 
                        response.getSearchPublicToiletPOIService().getToilets();
                    allToilets.addAll(batchToilets);
                    
                    logger.debug("배치 완료: {}개 추가, 현재 총 {}개", 
                        batchToilets.size(), allToilets.size());
                } else {
                    logger.warn("배치 응답이 비어있습니다: {}-{}", currentIndex, endIndex);
                }
                
                currentIndex = endIndex + 1;
                
                // API 호출 제한을 위한 짧은 대기
                if (currentIndex <= totalCount) {
                    try {
                        Thread.sleep(100); // 100ms 대기
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
            
            logger.info("서울시 공중화장실 데이터 조회 완료: {}개", allToilets.size());
            return allToilets;
            
        } catch (Exception e) {
            logger.error("서울시 API 호출 중 오류 발생", e);
            return new ArrayList<>();
        }
    }

    /**
     * 지정된 범위의 화장실 데이터를 조회합니다.
     * 
     * @param startIndex 시작 인덱스
     * @param endIndex 종료 인덱스
     * @return API 응답
     */
    private Mono<SeoulApiResponse> fetchToiletData(int startIndex, int endIndex) {
        String url = String.format("/%s/json/%s/%d/%d/", 
            apiKey, toiletService, startIndex, endIndex);
        
        logger.debug("API 호출: {}{}", baseUrl, url);
        
        return webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(SeoulApiResponse.class)
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
                .doOnSuccess(response -> {
                    if (response != null) {
                        logger.debug("API 응답 성공: {}-{}", startIndex, endIndex);
                    }
                })
                .doOnError(WebClientResponseException.class, ex -> {
                    logger.error("API 호출 실패: {} {}, 응답: {}", 
                        ex.getStatusCode(), ex.getStatusText(), ex.getResponseBodyAsString());
                })
                .doOnError(Exception.class, ex -> {
                    logger.error("API 호출 중 예외 발생: {}-{}", startIndex, endIndex, ex);
                });
    }

    /**
     * API 연결 테스트
     * 
     * @return 연결 성공 여부
     */
    public boolean testConnection() {
        logger.info("서울시 API 연결 테스트 시작");
        
        try {
            SeoulApiResponse response = fetchToiletData(1, 1)
                    .block(Duration.ofSeconds(10));
            
            boolean isSuccess = response != null && 
                               response.getSearchPublicToiletPOIService() != null &&
                               "INFO-000".equals(response.getSearchPublicToiletPOIService().getResult().getCode());
            
            if (isSuccess) {
                logger.info("서울시 API 연결 테스트 성공");
            } else {
                logger.error("서울시 API 연결 테스트 실패: 응답이 올바르지 않음");
            }
            
            return isSuccess;
            
        } catch (Exception e) {
            logger.error("서울시 API 연결 테스트 실패", e);
            return false;
        }
    }
}