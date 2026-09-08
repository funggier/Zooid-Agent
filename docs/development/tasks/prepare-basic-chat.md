# Prepare Basic Chat Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff เมื่อผู้ใช้สั่งเริ่ม; งานนี้ยังไม่เริ่มโดยการเขียนเอกสาร

**Goal:** ทำให้ขั้น Chat มี stack/provider/file map และคำสั่งตรวจที่ตัดสินจากหลักฐาน  
**Architecture:** minimal local CLI + provider interface  
**Tech Stack:** TypeScript/Node.js เป็น candidate หลัก; Python เป็นตัวเปรียบเทียบ  
**Spec:** [Basic chat](../phases/basic-provider-chat.md), [Decisions](../decisions/design-decisions.md)

## Task metadata

- ID: prepare-basic-chat
- Status: READY_AFTER_USER_START
- Owner: UNASSIGNED
- Depends on: คำสั่งเริ่ม implementation และ checkout repo ใหม่ที่ตรวจแล้ว
- Deliverable: รายงานเลือก stack + implementation task ของ chat foundation ที่มีคำสั่งรันจริง
- Scope: preparation ของขั้น 1; ไม่ดึง source fork เดิมหรือสร้าง Project framework

## ขั้นงานที่ตรวจรับได้

- [ ] ตรวจ current repo instructions/status/head และ claim งาน
- [ ] ตรวจ target OS, installed runtimes และ package tooling โดยไม่แสดง secrets
- [ ] เปรียบเทียบ candidate ด้วย mock request/cancel/cleanup prototype ใน scratch ของ checkout
- [ ] บันทึก dependency/packaging/permissions และเหตุผลเลือก; ลบ prototype ที่ไม่ใช้ตาม inventory
- [ ] เลือก provider protocol แรกจากการตั้งค่าที่มีสิทธิ์ใช้; ถ้ายังไม่มี credentials ให้ fixture งานเดินต่อได้
- [ ] ยืนยัน message/error/cancel contracts จาก phase Chat และปรับ file map หากเลือก stack ต่าง
- [ ] เขียน task chat-foundation พร้อม exact paths, dependency versions, setup/test/run commands และ expected results
- [ ] review ว่าไม่มี ticket/router/framework แฝงใน minimal scope
- [ ] commit decision/report/checkpoint แล้วเดินงาน chat-foundation ต่อเมื่ออยู่ใน authorized scope

## Acceptance

ผู้รับงานคนใหม่ต้อง setup, run mock chat และทดสอบ cancellation ได้ด้วยคำสั่งในรายงาน และรู้ว่า live provider ทดสอบแล้วหรือยัง เส้นทาง test data ต้องล้างได้โดยไม่พาดพิง live installations

หากไม่มี Windows ให้ยังทำ portable fixtures ได้แต่สถานะ Windows qualification ต้อง OPEN ไม่อ้างว่าผ่านแล้ว

## Proposed files เมื่อเริ่ม

แก้ decisions/design-decisions.md และ coordination state; เพิ่ม reports/provider-chat-foundation-assessment.md และ tasks/chat-foundation.md ตามผลจริง

ยังไม่สร้าง package.json, lockfile หรือ src files จากงานเอกสารชุดแรก
