# Task Template

ใช้ไฟล์นี้เป็นแม่แบบ ไม่ใช่งานที่เปิดอยู่ คัดลอกเป็นชื่อที่บอกผลลัพธ์แล้วแทนค่าทุกช่องก่อน claim

- Task ID: <semantic identifier>
- Status: <READY / IN_PROGRESS / BLOCKED / VERIFIED>
- Owner and branch: <actual owner and branch>
- Base SHA: <current source revision>
- Goal and reason: <outcome and why it matters>
- Authorized scope: <user instruction and boundaries>
- Dependencies: <passed gates and linked tasks>
- Spec / decisions: <relative links>
- Files: <exact create/modify/test paths and responsibilities>
- Inputs / outputs: <interface names and defined schemas>
- Steps: <independently checkable implementation actions>
- Acceptance scenarios: <given / when / then>
- Verification commands: <runnable commands and expected results>
- Lifecycle impact: <new resources and cleanup/recovery>
- Evidence report: <relative report link>
- Next checkpoint: <one concrete next action>

Task ที่ยังไม่เลือก stack ต้องระบุว่าเป็น assessment และผลที่ใช้ตัดสิน ไม่ใส่คำสั่งสมมติเป็นผลการรันทดสอบ
