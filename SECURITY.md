# 🔒 보안 가이드라인

## 🚨 절대 Git에 업로드하면 안 되는 것들

### API Keys & Secrets
```bash
# ❌ 절대 하지 마세요
const API_KEY = "your_actual_api_key_here";

# ✅ 올바른 방법
const API_KEY = process.env.KAKAO_API_KEY;
```

### 환경변수 파일들
- `.env` (실제 값이 있는 파일)
- `.env.local`
- `.env.production`
- `config.json` (API 키 포함)

### 개인 설정 파일들
- `.claude/` (개인 Claude 설정)
- `.idea/` (IntelliJ 설정)
- `.vscode/` (VS Code 설정)

### 민감한 문서들
- PDF 가이드 (API 키 포함)
- 개인 메모 파일
- 비밀번호 파일

## ✅ 안전한 방법들

### 1. 환경변수 사용
```javascript
// Frontend (Vite)
const API_KEY = import.meta.env.VITE_KAKAO_API_KEY;

// Backend (Java)
String API_KEY = System.getenv("SEOUL_API_KEY");
```

### 2. .env.example 제공
```bash
# .env.example (템플릿용)
VITE_KAKAO_API_KEY=your_key_here
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 3. 플랫폼별 Secrets 사용
- **GitHub**: Repository Secrets
- **Vercel**: Environment Variables
- **Railway**: Environment Variables

## 🛡️ .gitignore 확인사항

다음이 포함되어 있는지 확인:
```bash
# API & Secrets
*.env
*api-key*
*secret*
*credential*

# Personal configs
.claude/
.idea/
.vscode/

# Certificates
*.key
*.pem
*.crt

# Sensitive docs
*.pdf
*private*
*confidential*
```

## 🔍 보안 점검 체크리스트

### 배포 전 확인사항
- [ ] 모든 API 키가 환경변수로 처리됨
- [ ] .env 파일이 .gitignore에 포함됨
- [ ] 하드코딩된 API 키 없음
- [ ] 개인 설정 파일들 제외됨
- [ ] .env.example 파일 제공됨

### 배포 후 확인사항
- [ ] 프로덕션에서 환경변수 정상 작동
- [ ] API 키 노출 여부 확인
- [ ] HTTPS 적용 확인
- [ ] 도메인별 API 키 제한 설정

## ⚠️ 사고 발생 시 대응

### API 키 노출 시
1. **즉시 API 키 재발급**
2. **기존 키 비활성화**
3. **Git 히스토리에서 완전 삭제**
4. **새 키로 모든 환경 업데이트**

### Git 히스토리 정리
```bash
# 위험: 전체 히스토리 재작성
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch path/to/sensitive/file' \
--prune-empty --tag-name-filter cat -- --all
```

## 📋 보안 원칙

1. **최소 권한 원칙**: 필요한 최소한의 권한만 부여
2. **분리 원칙**: 개발/운영 환경 분리
3. **암호화 원칙**: 중요 데이터는 암호화
4. **정기 점검**: 주기적인 보안 점검
5. **즉시 대응**: 보안 사고 시 즉시 대응

---

**중요**: 의심스러운 것은 항상 제외하는 것이 안전합니다! 🛡️