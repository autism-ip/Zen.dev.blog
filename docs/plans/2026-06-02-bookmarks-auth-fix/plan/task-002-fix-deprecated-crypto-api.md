# Task 002: Fix deprecated crypto API

**depends-on**: task-001

## Description

修复 `src/lib/auth/crypto.js` 中废弃的 Node.js crypto API：`createCipher` → `createCipheriv`，`createDecipher` → `createDecipheriv`。

## Execution Context

**Task Number**: 002 of 007
**Phase**: Core Fixes
**Prerequisites**: Task 001 完成

## BDD Scenario

```gherkin
Scenario: 使用非废弃 API
  Given src/lib/auth/crypto.js 使用 Node.js crypto 模块
  When 加密或解密 token
  Then 使用 createCipheriv/createDecipheriv
  And 显式传入 IV
```

## Files to Modify/Create

- Modify: `src/lib/auth/crypto.js` (lines 22, 43)

## Steps

### Step 1: Fix encrypt function
- 第22行: `crypto.createCipher(ALGORITHM, key, iv)` → `crypto.createCipheriv(ALGORITHM, key, iv)`

### Step 2: Fix decrypt function
- 第43行: `crypto.createDecipher(ALGORITHM, key, iv)` → `crypto.createDecipheriv(ALGORITHM, key, iv)`

### Step 3: Verify
- 确认无废弃 API 调用

## Verification Commands

```bash
grep -n "createCipher\b\|createDecipher\b" src/lib/auth/crypto.js
# 应返回空

grep -n "createCipheriv\|createDecipheriv" src/lib/auth/crypto.js
# 应返回两行
```

## Success Criteria

- `createCipher`/`createDecipher` 不再出现
- `createCipheriv`/`createDecipheriv` 正确使用
- 输出格式兼容
