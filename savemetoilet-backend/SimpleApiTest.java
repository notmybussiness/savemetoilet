import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * 간단한 웹 서버로 API 테스트
 * Spring Boot 없이 순수 Java로 API 서버 구현
 */
public class SimpleApiTest {
    
    private static final String API_KEY = System.getenv("SEOUL_API_KEY");
    private static final String SEOUL_API_BASE = "http://openapi.seoul.go.kr:8088";
    private static final String SEOUL_SERVICE = "SearchPublicToiletPOIService";
    
    public static void main(String[] args) {
        try {
            // HTTP 서버 시작 (포트 8080)
            com.sun.net.httpserver.HttpServer server = 
                com.sun.net.httpserver.HttpServer.create(new InetSocketAddress(8080), 0);
            
            // CORS 설정을 위한 컨텍스트
            server.createContext("/api/v1/test/health", new HealthHandler());
            server.createContext("/api/v1/test/toilets/sample", new ToiletsHandler());
            server.createContext("/api/v1/test/connection", new ConnectionHandler());
            
            // 스레드 풀 설정
            server.setExecutor(Executors.newFixedThreadPool(4));
            
            // 서버 시작
            server.start();
            
            System.out.println("🚀 SaveMeToilet API Server Started!");
            System.out.println("📍 서버 주소: http://localhost:8080");
            System.out.println("🔍 테스트 URL:");
            System.out.println("   - Health Check: http://localhost:8080/api/v1/test/health");
            System.out.println("   - Connection Test: http://localhost:8080/api/v1/test/connection");
            System.out.println("   - Toilets Sample: http://localhost:8080/api/v1/test/toilets/sample");
            System.out.println("🛑 서버를 중지하려면 Ctrl+C를 누르세요.");
            
        } catch (Exception e) {
            System.err.println("서버 시작 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // 헬스 체크 핸들러
    static class HealthHandler implements com.sun.net.httpserver.HttpHandler {
        @Override
        public void handle(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
            // CORS 헤더 설정
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            String response = "{\n" +
                "  \"status\": \"UP\",\n" +
                "  \"message\": \"SaveMeToilet Backend is running\",\n" +
                "  \"timestamp\": " + System.currentTimeMillis() + ",\n" +
                "  \"version\": \"1.0.0\"\n" +
                "}";
            
            exchange.sendResponseHeaders(200, response.getBytes().length);
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }
    
    // 연결 테스트 핸들러
    static class ConnectionHandler implements com.sun.net.httpserver.HttpHandler {
        @Override
        public void handle(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
            // CORS 헤더 설정
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            boolean isConnected = testSeoulAPI();
            
            String response = "{\n" +
                "  \"success\": " + isConnected + ",\n" +
                "  \"message\": \"" + (isConnected ? "서울시 API 연결 성공" : "서울시 API 연결 실패") + "\",\n" +
                "  \"timestamp\": " + System.currentTimeMillis() + "\n" +
                "}";
            
            exchange.sendResponseHeaders(200, response.getBytes().length);
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
        
        private boolean testSeoulAPI() {
            try {
                String urlString = String.format("%s/%s/json/%s/1/1/", 
                    SEOUL_API_BASE, API_KEY, SEOUL_SERVICE);
                
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                
                return conn.getResponseCode() == 200;
            } catch (Exception e) {
                return false;
            }
        }
    }
    
    // 화장실 데이터 핸들러
    static class ToiletsHandler implements com.sun.net.httpserver.HttpHandler {
        @Override
        public void handle(com.sun.net.httpserver.HttpExchange exchange) throws IOException {
            // CORS 헤더 설정
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            
            try {
                // URL 파라미터에서 limit 추출
                String query = exchange.getRequestURI().getQuery();
                int limit = 10; // 기본값
                
                if (query != null && query.contains("limit=")) {
                    try {
                        String limitStr = query.split("limit=")[1].split("&")[0];
                        limit = Integer.parseInt(limitStr);
                        limit = Math.min(limit, 100); // 최대 100개로 제한
                    } catch (Exception e) {
                        limit = 10;
                    }
                }
                
                String toiletData = getToiletDataFromSeoul(limit);
                
                exchange.sendResponseHeaders(200, toiletData.getBytes("UTF-8").length);
                OutputStream os = exchange.getResponseBody();
                os.write(toiletData.getBytes("UTF-8"));
                os.close();
                
            } catch (Exception e) {
                String errorResponse = "{\n" +
                    "  \"success\": false,\n" +
                    "  \"message\": \"화장실 데이터 조회 실패: " + e.getMessage() + "\"\n" +
                    "}";
                
                exchange.sendResponseHeaders(500, errorResponse.getBytes().length);
                OutputStream os = exchange.getResponseBody();
                os.write(errorResponse.getBytes());
                os.close();
            }
        }
        
        private String getToiletDataFromSeoul(int limit) throws Exception {
            String urlString = String.format("%s/%s/json/%s/1/%d/", 
                SEOUL_API_BASE, API_KEY, SEOUL_SERVICE, limit);
            
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            if (conn.getResponseCode() != 200) {
                throw new Exception("Seoul API returned status: " + conn.getResponseCode());
            }
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "UTF-8"));
            
            StringBuilder seoulResponse = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                seoulResponse.append(line);
            }
            reader.close();
            
            // Seoul API 응답을 우리 형식으로 변환
            String seoulJson = seoulResponse.toString();
            
            // 간단한 JSON 변환 (정규식 사용)
            StringBuilder result = new StringBuilder();
            result.append("{\n");
            result.append("  \"success\": true,\n");
            
            // 총 개수 추출
            if (seoulJson.contains("list_total_count")) {
                String totalCount = extractValue(seoulJson, "list_total_count");
                result.append("  \"total_count\": ").append(totalCount).append(",\n");
            }
            
            result.append("  \"sample_count\": ").append(limit).append(",\n");
            result.append("  \"message\": \"화장실 데이터 샘플 조회 성공\",\n");
            result.append("  \"data\": ").append(seoulJson).append("\n");
            result.append("}");
            
            return result.toString();
        }
        
        private String extractValue(String json, String key) {
            try {
                int startIdx = json.indexOf("\"" + key + "\":");
                if (startIdx == -1) return "0";
                
                startIdx = json.indexOf(":", startIdx) + 1;
                int endIdx = json.indexOf(",", startIdx);
                if (endIdx == -1) endIdx = json.indexOf("}", startIdx);
                
                return json.substring(startIdx, endIdx).trim();
            } catch (Exception e) {
                return "0";
            }
        }
    }
}