import java.io.*;
import java.net.*;
import java.util.Scanner;

/**
 * 간단한 API 테스트 클라이언트
 * Seoul API 연동 테스트용
 */
class TestApiClient {
    
    private static final String API_KEY = System.getenv("SEOUL_API_KEY");
    private static final String BASE_URL = "http://openapi.seoul.go.kr:8088";
    private static final String SERVICE = "SearchPublicToiletPOIService";
    
    public static void main(String[] args) {
        System.out.println("=== Seoul API Test Client ===");
        
        // 1. 연결 테스트
        System.out.println("1. API 연결 테스트 중...");
        testConnection();
        
        // 2. 화장실 데이터 조회 테스트
        System.out.println("2. 화장실 데이터 조회 테스트 중...");
        getToiletData(1, 5);
        
        System.out.println("=== 테스트 완료 ===");
    }
    
    private static void testConnection() {
        try {
            String urlString = String.format("%s/%s/json/%s/1/1/", 
                BASE_URL, API_KEY, SERVICE);
            
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            
            int responseCode = conn.getResponseCode();
            System.out.println("응답 코드: " + responseCode);
            
            if (responseCode == 200) {
                System.out.println("✅ API 연결 성공!");
            } else {
                System.out.println("❌ API 연결 실패: " + responseCode);
            }
            
        } catch (Exception e) {
            System.out.println("❌ 연결 오류: " + e.getMessage());
        }
    }
    
    private static void getToiletData(int start, int end) {
        try {
            String urlString = String.format("%s/%s/json/%s/%d/%d/", 
                BASE_URL, API_KEY, SERVICE, start, end);
            
            System.out.println("요청 URL: " + urlString);
            
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            int responseCode = conn.getResponseCode();
            
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), "UTF-8"));
                
                StringBuilder response = new StringBuilder();
                String line;
                
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                String jsonResponse = response.toString();
                System.out.println("✅ 데이터 조회 성공!");
                System.out.println("응답 길이: " + jsonResponse.length() + " 문자");
                
                // JSON에서 총 개수 추출
                if (jsonResponse.contains("list_total_count")) {
                    int startIdx = jsonResponse.indexOf("list_total_count") + 18;
                    int endIdx = jsonResponse.indexOf(",", startIdx);
                    if (endIdx == -1) endIdx = jsonResponse.indexOf("}", startIdx);
                    
                    String countStr = jsonResponse.substring(startIdx, endIdx).replaceAll("[^0-9]", "");
                    System.out.println("총 화장실 개수: " + countStr + "개");
                }
                
                // 첫 번째 화장실 이름 추출 (간단한 방식)
                if (jsonResponse.contains("FNAME")) {
                    int nameStart = jsonResponse.indexOf("FNAME\":\"") + 8;
                    int nameEnd = jsonResponse.indexOf("\"", nameStart);
                    if (nameStart > 7 && nameEnd > nameStart) {
                        String firstName = jsonResponse.substring(nameStart, nameEnd);
                        System.out.println("첫 번째 화장실: " + firstName);
                    }
                }
                
                System.out.println("샘플 응답 (처음 200자):");
                System.out.println(jsonResponse.substring(0, Math.min(200, jsonResponse.length())) + "...");
                
            } else {
                System.out.println("❌ 데이터 조회 실패: " + responseCode);
            }
            
        } catch (Exception e) {
            System.out.println("❌ 데이터 조회 오류: " + e.getMessage());
            e.printStackTrace();
        }
    }
}