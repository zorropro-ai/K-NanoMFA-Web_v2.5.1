# K-NanoMFA Web v2.5.1

압축을 완전히 풀고 **index.html**을 Chrome 또는 Edge에서 여세요. JavaScript와 CSS 파일은 같은 폴더에 유지하세요. 계산은 로컬에서 실행되며 설치·서버 연결이 필요하지 않습니다. 인터페이스는 영어, 안내와 검증 요약은 한국어입니다.

## 화면 수정과 두 언어 매뉴얼

- Feature directory 버튼을 제목 아래로 옮겨 버튼 폭이 과도하게 줄어드는 구조를 수정했습니다.
- 제목·버튼·설명문은 단어 단위로 줄바꿈합니다. 넓은 표는 내부 가로 스크롤을 유지합니다.
- 프로그램 상단에서 [English manual](USER_MANUAL_EN.html)과 [한국어 매뉴얼](USER_MANUAL_KO.html)을 열 수 있습니다. 목차와 인쇄 스타일을 제공합니다.
- Chromium 실제 렌더링을 다시 수행했습니다. 데스크톱 1366×768, 1440×980, 1920×1080과 반응형 에뮬레이션 768×1024, 360×800, 390×844에서 페이지 전체 가로 넘침이 없음을 확인했습니다. 실제 화면 캡처는 한글·영문 매뉴얼에 포함했습니다. 물리적 모바일 기기 검증은 별도입니다. [화면 수정·검증 범위](UI_VERIFICATION_v2.5.1.md)를 확인하세요.
- 아래 수치 검증 기록은 v2.5.0 때 수행한 시험입니다. 이번 변경은 화면·문서와 버전 식별에 집중했습니다. 계산 회귀 10항목과 DOM 입출력 시험은 재실행했습니다.

## 계산 기능

- 정상상태를 각 매체·형태의 재고 변화와 유입·유출 수지로 판정합니다. 제거 경로 없이 계속 축적되는 상태를 거부합니다.
- 질량 기준 또는 원소 함량을 바꾸면 입력된 초기 재고도 환산하고 이력을 남깁니다.
- 강우 이동은 사건 직전 재고를 기준으로 동시에 계산합니다. 정상상태 모드에서는 강우 사건을 차단합니다.
- 계수·환경용량의 출처, 실험 조건, 적용 물질·지역·기간·단위·범위와 속도별 CV를 기록합니다.
- 관측 자료의 분석법·배경처리·시간 대표성·측정대상·자료 독립성을 점검하고 보정에 쓴 dataset ID를 독립 검증에서 제외합니다.
- ±20% 국소 민감도와 표본 수·seed별 P5/P50/P95 반복성 진단을 추가했습니다. 결과 Excel에 진단을 포함합니다.
- 본문 14 px, 입력·표 약 13 px의 Compact 설정과 Standard/Large 선택을 유지했습니다.

## 권장 실행 순서

1. 물질, 지역, 연도, 유입량 및 실제 환경용량을 입력합니다. 기본 계수는 실측치가 아닙니다.
2. Nanoform과 28-state fate를 켜고 질량 기준·초기 재고·동적/정상상태 모드를 확인합니다.
3. Calculate 후 질량수지와 수렴 진단을 확인합니다. 강우 사건은 동적 모드에서 실행합니다.
4. Evidence and numerical qualification에서 필요한 계수 근거를 등록합니다.
5. 관측값의 매체·형태·단위·질량 기준·연도·시간 통계를 일치시키고 보정 자료 ID를 등록합니다.
6. 민감도와 반복성을 실행합니다. Quick은 작동 점검이며 연구용 반복성 검증을 대신하지 않습니다.
7. 결과 재현 Excel과 시나리오 Excel을 저장합니다. 입력을 바꾼 뒤에는 다시 계산하세요.

**질량수지와 수치 시험 통과만으로 현장 PEC의 정확성이 입증되지는 않습니다.** 동봉된 WWTP 범위 비교도 지역 환경 PEC의 독립 검증이 아닙니다.

- 조작 안내: [USER_GUIDE_v2.5.0.html](USER_GUIDE_v2.5.0.html)
- 수정·검증 결과: [VERIFICATION_v2.5.0.md](VERIFICATION_v2.5.0.md)
- 계산식·적용 한계: [SCIENTIFIC_METHODS_v2.5.0.md](SCIENTIFIC_METHODS_v2.5.0.md)
- 실제 관측자료 점검: [EMPIRICAL_CHECK_v2.5.0.md](EMPIRICAL_CHECK_v2.5.0.md)

## 시험 재현

일반 웹 실행에는 Node/Python이 필요하지 않습니다. 시험 재현에는 Node.js, Python, NumPy/SciPy가 필요합니다.

```
python run_verification.py
python verify_scipy_v250.py
node verify_empirical_v250.js
node verify_stability_v250.js
node verify_linked_v250.js
node test_dom_v250.js
```

마지막 DOM 시험에는 jsdom 26.1.0을 별도로 설치해야 합니다. 이 시험은 Plotly를 대체하여 이벤트와 데이터 흐름을 점검하며 실제 브라우저 렌더링 시험이 아닙니다. `test_*v240.js` 등은 이전 버전부터 유지한 회귀시험입니다. 포함된 v2.5 결과는 현재 코드를 실행해 생성했습니다.

Developer: Prof. Younghun Kim, Kwangwoon University · korea1@kw.ac.kr
Version: 2.5.1-en · 19 September 2026 · MIT License


## Detailed manuals (documentation update, 19 September 2026)

English (26 pages) and Korean (27 pages) manuals are included as PDF and editable Word documents. They now include verified Chromium screenshots for the main workspaces, results, feature search, expert tools, and mobile-responsive examples. Each has 16 chapters and appendices A–E, with inputs, units, workflow, equations, interpretation, independent-validation requirements and troubleshooting. Open the corresponding User manual link, then Complete user manual / 상세 사용자 매뉴얼.

CHROME_CHECK_KO.html provides concrete desktop, responsive-emulation and error-reporting steps. Chromium rendering was verified after temporarily relaxing the execution sandbox's managed local-URL block. Desktop and responsive-emulation checks passed at the tested viewport sizes; physical-mobile interaction remains unverified.
