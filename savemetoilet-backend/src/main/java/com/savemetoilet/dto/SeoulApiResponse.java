package com.savemetoilet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Seoul Open Data API Response DTO
 * 서울시 공공데이터 API 응답 구조를 매핑하는 클래스
 */
public class SeoulApiResponse {

    @JsonProperty("SearchPublicToiletPOIService")
    private SearchPublicToiletPOIService searchPublicToiletPOIService;

    public SearchPublicToiletPOIService getSearchPublicToiletPOIService() {
        return searchPublicToiletPOIService;
    }

    public void setSearchPublicToiletPOIService(SearchPublicToiletPOIService searchPublicToiletPOIService) {
        this.searchPublicToiletPOIService = searchPublicToiletPOIService;
    }

    public static class SearchPublicToiletPOIService {
        @JsonProperty("list_total_count")
        private Integer listTotalCount;

        @JsonProperty("RESULT")
        private Result result;

        @JsonProperty("row")
        private List<ToiletData> toilets;

        // Getters and Setters
        public Integer getListTotalCount() {
            return listTotalCount;
        }

        public void setListTotalCount(Integer listTotalCount) {
            this.listTotalCount = listTotalCount;
        }

        public Result getResult() {
            return result;
        }

        public void setResult(Result result) {
            this.result = result;
        }

        public List<ToiletData> getToilets() {
            return toilets;
        }

        public void setToilets(List<ToiletData> toilets) {
            this.toilets = toilets;
        }
    }

    public static class Result {
        @JsonProperty("CODE")
        private String code;

        @JsonProperty("MESSAGE")
        private String message;

        // Getters and Setters
        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class ToiletData {
        @JsonProperty("POI_ID")
        private String poiId;

        @JsonProperty("FNAME")
        private String name;  // 화장실명

        @JsonProperty("ANAME")
        private String type;  // 화장실 유형 (예: "민간개방화장실")

        @JsonProperty("CNAME")
        private String category;

        @JsonProperty("X_WGS84")
        private Double longitude;  // 경도

        @JsonProperty("Y_WGS84")
        private Double latitude;   // 위도

        @JsonProperty("INSERTDATE")
        private String insertDate;

        @JsonProperty("UPDATEDATE")
        private String updateDate;

        // Getters and Setters
        public String getPoiId() {
            return poiId;
        }

        public void setPoiId(String poiId) {
            this.poiId = poiId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public String getInsertDate() {
            return insertDate;
        }

        public void setInsertDate(String insertDate) {
            this.insertDate = insertDate;
        }

        public String getUpdateDate() {
            return updateDate;
        }

        public void setUpdateDate(String updateDate) {
            this.updateDate = updateDate;
        }

        @Override
        public String toString() {
            return "ToiletData{" +
                    "poiId='" + poiId + '\'' +
                    ", name='" + name + '\'' +
                    ", type='" + type + '\'' +
                    ", longitude=" + longitude +
                    ", latitude=" + latitude +
                    '}';
        }
    }
}