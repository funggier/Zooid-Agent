# Report Template

ใช้กับงานที่ทำแล้ว แทนค่าทุกช่องก่อนรายงาน completion

- Task / scope: <what was authorized>
- Outcome: <actual outcome and remaining limitation>
- Source tested SHA: <code revision>
- Environment: <OS/runtime/dependency versions>
- Changed files and reason: <focused list>
- Verification: <command, observed result, relevant output reference>
- Acceptance mapping: <criterion to evidence>
- Failure/recovery checks: <fault point and observed durable state>
- Lifecycle inventory: <resources created/removed/retained>
- External operations: <receipt reference or uncertainty; never secrets>
- Unverified items: <what could not be tested and why>
- Decisions: <linked decision records>
- Next action: <exact next step>
- Report commit: <record externally or in later checkpoint when known>

แยกผล fixture, live API, actual process และ OS-specific tests ไม่ใช้จำนวน tests แทนการอธิบายขอบเขตที่ตรวจ
