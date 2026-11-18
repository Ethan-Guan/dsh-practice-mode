# 刷题模式插件 — 协作契约（CONTRACT）

本文件是所有并行开发者的唯一接口契约。**先读完本文件，再动手；只修改自己 ownership 内的文件。**

## 0. 目标与形态

在 DeepSeek Harness Web GUI 中新增「刷题模式」：

- 左侧插件栏（`sidebar.panellist`）新增「刷题模式」入口；点击后主区（`main` keyed slot，key=`practice-mode`）渲染刷题工作台。
- 工作台三栏：左侧课程栏（约 236px）＋中间刷题区（核心）＋右侧对话区（约 380px）。
- 课程：新建课程；上传课程文档（文件或目录）；每套题在课程下新建；一套刷完可继续上传下一套。
- 题目解析：上传题目文件（PDF / DOCX / PPTX / 图片 / txt / md），Host 用 LibreOffice Kit 渲染页面图，再交给多模态 LLM 解析成结构化题目；支持跨题共用材料（groups）、单选/多选/判断/填空/简答、图片（LLM 重绘 SVG）。
- 答题：每题作答、提交；「答一题看一题」或「全部做完再看」两种模式；答案解析区有「一键提问」→ 右侧对话区直接提问该题。
- 右侧对话：与刷题内容协同（当前题目 / 选中文字 / 课程文档上下文），基于课程文档回答问题，流式输出。
- 刷题区可框选文字 → 浮动「提问」按钮 → 附加到右侧对话栏。
- 数据：做题记录、课程级看板（正确率、题型分布、易错题、复习重点、复习方案）与全局看板；分析由 LLM 结合课程文档生成。

## 1. 环境与命令

- 工作目录：`/Users/ethan/Documents/deepseek-harness/default-workspace/practice-mode`
- Node（唯一可用）：`/Users/ethan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node`
- Python（仅用于生成测试 fixture，不要在生产代码依赖）：`/Users/ethan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3`（自带 python-docx / python-pptx / Pillow）
- LibreOffice Kit CLI（Host 运行时调用）：
  - node：`<Resources>/runtime/primary-runtime/dependencies/node/bin/node`
  - cli：`<Resources>/app.asar.unpacked/dsh/node_modules/@deepseek-ai/libreoffice-kit/lib/cli.js`
  - 其中 `<Resources>` = `/Applications/DeepSeek Harness.app/Contents/Resources`；Host 代码中优先由 `process.resourcesPath` 推导，找不到时回退。
  - 已验证：`convert --input x.docx --output x.pdf`、`render --input x.pdf --output-dir dir --dpi 120 --pages all`，stdout 输出 JSON（含 images[].path）。
- 语法检查：`"$NODE" --check <file>`（本包 `type: module`）。
- 不要执行 `pnpm`/`npm install`、不要安装/卸载插件、不要修改 profile；**不要运行 `tools/build-client.mjs`（Lead 统一构建）**。
- 不要修改其他人的文件；如接口需要调整，先在 `coord/` 下写一条 `coord/<你的名字>-note.md` 并给 Lead 发消息。

## 2. 包结构与文件 ownership

```
practice-mode/
  package.json / cordis.patch.yml / locale/*.json / icon.svg   Lead（已完成）
  index.js                                                      Lead（Host 入口，接线）
  tools/build-client.mjs                                        Lead
  docs/CONTRACT.md                                              Lead
  lib/host/paths.js                                             Lead
  lib/host/store.js, jobs.js, api.js                            host-api-dev
  lib/host/llm.js, prompts.js, agent-runtime.js, tasks.js, render.js host-llm-dev
  lib/host/extract/index.js, zip.js, docx.js, pptx.js, pdf.js, text.js  extract-dev
  src/client/10-utils.js, 20-store.js, 90-app.js, 99-footer.js  Lead
  src/client/30-rail.js, 60-dash.js                             course-ui-dev
  src/client/40-practice.js                                     practice-ui-dev
  src/client/50-chat.js, 70-selection.js, 75-composer-attach.js chat-ui-dev
  src/client/css/base.css                                       Lead
  src/client/css/rail.css, dash.css                             course-ui-dev
  src/client/css/practice.css                                   practice-ui-dev
  src/client/css/chat.css                                       chat-ui-dev
  test/*.test.mjs                                               对应 owner
  client.js                                                     构建产物，Lead 生成，勿手改
```

Client 构建模型：`src/client/*.js` 按文件名排序拼接进 `window.__ModuleLoader__.load({ id: 'dsh-practice-mode', factory(require) { ...concat...; } })`；所有碎片共享同一函数作用域，可用 `h`、`React`、`DSP`。CSS 由 `src/client/css/*.css` 拼接成 `__DSP_CSS__` 字符串。**碎片内不要使用 ESM import/export；顶层 const 前缀取本文件编号避免重名。**

## 3. Host 数据模型（`$DSH_HOME/practice/`）

数据根目录：`process.env.DSH_HOME || ~/.dsh` + `/practice`（由 Lead 的 `paths.js` 提供）。

```
practice/
  store.json                                   # 全量汇总状态（见下）
  courses/<courseId>/
    course.json                                # 可选：冗余备份，不必写
    docs/<docId>/<filename>                    # 上传的课程文档原件
    docs/<docId>/text.md                       # 抽取出的纯文本（可为空）
    assets/<name>                              # 文档/题目图片、SVG 重绘产物
    sets/<setId>/source/<filename>             # 上传的题目文件原件
    sets/<setId>/pages/page-0001.png           # LibreOffice 渲染页图（可保留）
    sets/<setId>/set.json                      # 解析后的题目集（见下）
    chat/<threadId>.json                       # 对话线程
  tmp/                                         # 临时转换目录（jobs 自行清理）
```

### 3.1 store.json

```jsonc
{
  "version": 1,
  "updatedAt": 1700000000000,
  "courses": [
    {
      "id": "c_ab12cd34",
      "name": "高等数学",
      "description": "",
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "docs": [
        {
          "id": "d_xxx",
          "name": "1.1 极限.pdf",
          "relativePath": "第一章/1.1 极限.pdf",   // 上传时的相对路径（含目录），AI 与 UI 用它展示结构
          "relPath": "courses/c_x/docs/d_x/第一章/1.1 极限.pdf",
          "textRelPath": "courses/c_x/docs/d_x/text.md",   // 抽取失败为 null
          "ext": ".pdf",
          "size": 12345,
          "status": "ready",              // ready | empty | unsupported | failed
          "error": null,
          "chars": 12345,
          "addedAt": 1700000000000
        }
      ],
      "sets": [
        {
          "id": "s_xxx",
          "title": "期中卷",
          "status": "draft",              // draft | parsing | ready | failed
          "error": null,
          "createdAt": 0,
          "updatedAt": 0,
          "sourceFiles": [{ "name": "期中卷.pdf", "relativePath": "第一章/期中卷.pdf", "relPath": "courses/.../source/第一章/期中卷.pdf", "ext": ".pdf", "size": 123, "role": "questions" }],
          "aiAnswerMode": "auto",            // auto | off | regenerate（AI 生成答案解析的策略）
          "questionCount": 0,
          "answeredCount": 0,             // 由 records 派生，后端维护
          "mode": "immediate",            // immediate | end（用户在开始练习时选择）
          "startedAt": null,
          "completedAt": null,
          "warnings": []
        }
      ],
      "records": [
        {
          "id": "r_xxx",
          "setId": "s_xxx",
          "questionId": "q_xxx",
          "at": 1700000000000,
          "answer": ["B"],                 // 规范化数组：选项 key / 判断"正确" / 填空文本数组
          "correct": true,                 // boolean | null（未判定）
          "revealed": true,
          "durationMs": 12000,
          "mode": "immediate",
          "selfGraded": false,
          "aiGrade": null                     // AI 判题结果：{verdict,score,standardAnswer,mistakeAnalysis,explanation,suggestions,summary?,correctedAnswer?,refs,generatedAt} | null
        }
      ],
      "analyses": {
        "course": { "markdown": "...", "generatedAt": 0, "stale": false }
        // "set:<setId>" 同理
      },
      "chatThreads": [
        { "id": "t_xxx", "title": "新对话", "createdAt": 0, "updatedAt": 0, "messageCount": 2, "questionId": null }
      ]
    }
  ],
  "global": {
    "analysis": { "markdown": "...", "generatedAt": 0 }
  }
}
```

### 3.2 set.json

```jsonc
{
  "id": "s_xxx",
  "courseId": "c_xxx",
  "title": "期中卷",
  "createdAt": 0,
  "updatedAt": 0,
  "pages": [{ "page": 1, "relPath": "courses/.../pages/page-0001.png" }],
  "groups": [
    { "id": "g1", "material": "（共用材料/阅读材料全文）", "figures": [] }
  ],
  "questions": [
    {
      "id": "q1",
      "number": "1",
      "type": "single",                  // single | multiple | judge | fill | short | other
      "groupId": null,                   // 跨题共用材料时指向 group
      "stem": "题干（不含选项）",
      "options": [{ "key": "A", "text": "..." }],
      "answer": ["B"],                   // 规范化数组；简答可为参考答案文本数组
      "answerDisplay": "B",              // 展示用答案串
      "hasAnswer": true,                 // 原卷是否明确给出答案/解析
      "answerSource": "source",          // source | ai-doc | ai（ai-doc=AI 参考答案且引用课程文档）
      "answerRefs": [],                  // AI 参考答案引用的课程文档相对路径
      "sourceAnswer": [],                // regenerate 模式下被覆盖的原卷答案（供 UI 核对）
      "sourceAnswerDisplay": "",
      "analysis": "解析（优先原题解析，否则 AI 结合课程文档生成）",
      "figures": [],
      "tags": ["导数"],
      "difficulty": "medium"
    }
  ],
  "warnings": []
}
```

`set.json` 中图片统一用相对数据根的 `relPath`，客户端通过 `/api/practice/asset?courseId=...&path=...` 取；`figures` = `[{ "kind": "svg", "relPath": "courses/.../assets/f_s1_q1_1.svg", "alt": "图1" }]`；若视觉元素无法转 SVG，兜底为 `{ "kind": "image", "relPath": "courses/.../sets/<sid>/pages/page-0001.png", "alt": "题目所在页面（自动保留）" }`，客户端按 relPath 通用渲染。

### 3.3 chat/<threadId>.json

```jsonc
{
  "id": "t_xxx",
  "courseId": "c_xxx",
  "title": "新对话",
  "createdAt": 0,
  "updatedAt": 0,
  "messages": [
    { "role": "user", "text": "请讲解第 3 题", "at": 0,
      "context": { "questionId": "q3", "selectedText": "", "docNames": [] } },
    { "role": "assistant", "text": "……markdown……", "at": 0, "refs": ["第一章.pdf"] }
  ]
}
```

## 4. HTTP API（Host 注册到 `ctx.connection.fetch.register`，浏览器同源 `fetch('api/practice/…')`）

统一：POST 请求 `content-type: application/json`，响应 `application/json`；出错响应 `{ "ok": false, "error": "用户可读中文原因" }` + 4xx/5xx。成功响应 `{ "ok": true, ... }`。所有路由前缀 `/api/practice`。`requestBody: 'buffered'`。GET 路由用 query 参数。

| Method | Path | 请求 | 成功响应 |
|---|---|---|---|
| GET | `/api/practice/bootstrap` | - | `{ok, data: {courses, global, capabilities}}`，`courses` 为 store.json 的 courses（docs/sets/records/analyses/chatThreads 全量；不含 set.json 题目正文），`capabilities: {images:boolean, render:boolean, model:{provider,model}}` |
| GET | `/api/practice/set` | `?courseId=&setId=` | `{ok, data: set.json}` |
| GET | `/api/practice/job` | `?jobId=` | `{ok, data: {id,kind,status,progress,message,result,error}}`；未知 job → 404 |
| GET | `/api/practice/asset` | `?courseId=&path=` | 二进制（Content-Type 按扩展名）；path 必须以 `courses/<courseId>/` 开头且不含 `..` |
| POST | `/api/practice/course` | `{action:'create'\|'update'\|'delete', courseId?, name?, description?}` | create/update → `{ok, courseId}`；delete → `{ok}` |
| POST | `/api/practice/doc/delete` | `{courseId, docId}` | `{ok}`；删除文档元数据与 `docs/<docId>/` 目录 |
| GET | `/api/practice/thread` | `?courseId=&threadId=` | `{ok,data:{id,title,messages}}`；不存在 404 |
| POST | `/api/practice/upload` | `{courseId, category:'doc'\|'question', setId?, role?, files:[{name, path, data}]}`，`data` 为 base64，`path` 为相对文件名（目录上传时含子目录）；`setId` 用于把文件追加到已有题目集；`role` 为 `questions`(默认) 或 `answers` | doc → `{ok, docs, skipped}`；question 无 setId → `{ok,setId,files,skipped}`（新 set 状态 draft）；带 setId → 追加 sourceFiles（含 role）并置 set.status='draft' |
| POST | `/api/practice/parse` | `{courseId, setId}` | `{ok, jobId}`；后台解析并写 set.json + 更新 set 状态 |
| POST | `/api/practice/answers` | `{courseId, setId, records:[{id,questionId,answer,correct,revealed,durationMs,mode,selfGraded}]}` | `{ok, count}`（按 record.id upsert，并维护 set.answeredCount） |
| POST | `/api/practice/set/mode` | `{courseId, setId, mode:'immediate'\|'end'}` | `{ok}` |
| POST | `/api/practice/set/ai-mode` | `{courseId, setId, aiAnswerMode:'auto'\|'off'\|'regenerate'}` | `{ok}` |
| POST | `/api/practice/grade` | `{courseId, setId, questionId, userAnswer:string[]}` | `{ok, jobId}`；job.result=`{verdict:'correct'\|'partial'\|'incorrect', score:0-100, standardAnswer, mistakeAnalysis, explanation, suggestions:[], summary?, correctedAnswer?, refs:[], generatedAt}` |
| POST | `/api/practice/set/complete` | `{courseId, setId}` | `{ok, summary:{questionCount,answeredCount,correctCount,accuracy,durationMs}}` 并置 completedAt |
| POST | `/api/practice/set/delete` | `{courseId, setId}` | `{ok}` |
| POST | `/api/practice/diagnose` | `{courseId, scope:'course'\|'set'\|'global', setId?}` | `{ok, jobId}`；完成后 analysis 写入 store（bootstrap 可见），job.result = `{markdown}` |
| POST | `/api/practice/svg` | `{courseId, setId, questionId, figureIndex, instruction?}` | `{ok, jobId}`；完成后把该题 `figures[figureIndex]` 覆盖为生成的 SVG，job.result=`{relPath}` |
| POST | `/api/practice/chat` | `{courseId, threadId?, message:{text, questionId?, setId?, selectedText?, docNames?}}` | **SSE**：`content-type: text/event-stream`，每帧 `data: {json}\n\n`；帧类型：`{"type":"meta","threadId":"t_x"}`、`{"type":"delta","text":"..."}`、`{"type":"done","message":{role:'assistant',text,at,refs}}`、`{"type":"error","error":"..."}`。用户消息在开始时就持久化。 |
| POST | `/api/practice/chat/clear` | `{courseId, threadId?}` | `{ok, threadId?}`：清空当前线程消息或新开线程 |
| GET | `/api/practice/ping` | - | `{ok:true, version, dataRoot}` 供验证 |

鉴权：`ctx.connection.fetch.register` 的请求已通过浏览器 owner 鉴权，无需额外校验。

## 5. Host 模块接口（精确签名，不要擅自改）

### 5.1 `lib/host/paths.js`（Lead 已写）

```js
export function resolveDataRoot()      // $DSH_HOME/practice
export function resolveResourcesRoot() // process.resourcesPath ?? app 资源目录
export function resolveNodeBinary()    // LibreOffice Kit 用的 node
export function resolveOfficeCli()     // LibreOffice Kit cli.js
```

### 5.2 `store.js`（host-api-dev）

```js
export async function createStore({ rootDir, logger }) -> store
// store 方法（全部返回 Promise，除 get()）：
//   ready(): Promise<state>            // 初始化目录 + 读 store.json（不存在则建默认）
//   get(): state                       // ready() 之后的同步快照
//   update(mutator: (state)=>void|Promise<void>): Promise<state>  // 串行化 + 原子落盘（tmp+rename），异常回滚
//   abs(relPath): string               // 数据根下绝对路径；越界抛错
//   dir(relPath): Promise<string>      // mkdir -p 并返回绝对路径
//   writeFile(relPath, data): Promise<void>   // string 或 Uint8Array
//   readFile(relPath): Promise<Buffer>
//   readText(relPath): Promise<string>
//   exists(relPath): Promise<boolean>
//   remove(relPath): Promise<void>
//   newId(prefix): string              // `${prefix}_` + 8~12 位小写字母数字
```

### 5.3 `jobs.js`（host-api-dev）

```js
export function createJobs({ ttlMs = 30*60*1000, logger }) -> jobs
// jobs.start(kind: string, runner: ({progress(message, percent?), signal}) => Promise<any>, meta?: object) -> jobId
// jobs.get(jobId): {id,kind,status:'running'|'done'|'error',progress:number,message:string,result?:any,error?:string,startedAt,endedAt?}|undefined
// jobs.cancel(jobId): void
// jobs.dispose(): void
```

### 5.4 `llm.js`（host-llm-dev，仅状态/图片能力探测）

```js
export function createLlm({ getLlm, getAttachments, getDefaultModel, logger }) -> llm
// getLlm: () => ctx.llm|undefined；getAttachments: () => ctx.attachments|undefined；
// getDefaultModel: () => ({provider,model,reasoningEffort?}|undefined)
// llm.available(): boolean
// llm.selection(): {provider, model, reasoningEffort?}       // 缺省回退 deepseek-official/deepseek-flash
// llm.supportsImages(): Promise<boolean>
// llm.complete({ system, userText, images?, maxTokens?, temperature?, signal? })
//    -> Promise<{ text: string }>；images: [{ path:string, mediaType:'image/png'|'image/jpeg' }]
//    画面为绝对路径，内部经 attachments.saveImage + ImageBlock 发送；attachments 不可用时忽略图片并在结果里 warning？
//    （简单策略：不支持图片时抛错，让调用方降级）
// llm.stream({ system, userText, images?, maxTokens?, signal? }) -> AsyncIterable<
//    {type:'delta', text:string} | {type:'done'} | {type:'reasoning', text:string}>
//    失败抛 Error（message 为中文可读原因）
```

实现要点：`ctx.llm.stream({provider, model, reasoningEffort, system, messages:[{role:'user', content:[{type:'text',text}, ...图片]}], signal})`；遍历 chunk：`text-delta` 累积，`reasoning-delta` 可忽略/转发，`finish.kind==='error'` 抛错。图片块 `{type:'image', attachment:ref}`。

### 5.5 `render.js`（host-llm-dev）

```js
export function createRender({ logger }) -> render
// render.available(): Promise<boolean>
// render.officeToPdf(inputAbs, outputAbs, {signal}) -> Promise<void>
// render.renderPages(inputAbs, outputDirAbs, {dpi=120, signal}) -> Promise<{pages:[{page:number, path:string, width,height}], missingFonts:string[]}>
// 使用 paths.js 的 resolveNodeBinary()/resolveOfficeCli() 通过 child_process.execFile 调用 CLI；
// 超时 180s；stdout 是 JSON（convert 也有 JSON），stderr 用于错误信息；失败抛中文 Error。
// 输出目录必须不存在或为空：render 到 `<dir>`（CLI 要求 fresh directory）。
```

### 5.6 `tasks.js`（host-llm-dev）

```js
export function createTasks({ store, runtime?, getRuntime?, logger }) -> tasks
// tasks.parseSet({courseId, setId, signal, progress}) -> Promise<{questionCount:number, warnings:string[]}>
// tasks.diagnose({courseId, scope:'course'|'set'|'global', setId?, signal, progress}) -> Promise<{markdown:string}>
// tasks.redrawFigure({courseId, setId, questionId, figureIndex, instruction?, signal, progress}) -> Promise<{relPath:string}>
// tasks.chat({courseId, threadId?, message:{text, questionId?, setId?, selectedText?}, signal, onDelta(text), onMeta(threadId)}) -> Promise<{threadId, reply:{role:'assistant', text, at, refs}}>
```

所有 AI 任务统一走 `runtime.runTurn`（DSH Agent），不再走 `ctx.llm`。

parseSet 流程：
1. 从 store state 找到 set 与 sourceFiles；读取每个文件。
2. **不预渲染页面图**：题目/答案原件直接交给 Agent，工作目录为 `courses/<cid>/sets/<sid>/source`。
3. 每个文件一次 Agent turn：提示词里带完整 JSON 格式（title/groups/questions + answerFigures）；`submit_questions` 工具回传同一份 JSON。
4. Agent 结果优先取 `turn.result`，否则 `turn.text`；`normalizeParsedSet` 规范化；figure 落盘 `assets/`（文件名 `f_<setId>_<owner>_<i>.<ext>`）。
5. 答案文件同样每个文件一次 turn，`submit_answer_key`；答案匹配回题目，`answerFigures` 一并落盘。
6. AI 参考答案每批 ≤8 题，`submit_reference_answers`；`store.update` 更新 set 状态。
7. 超时/中断时 `runTurn` 的错误带 `error.partial = {text,result}`，优先使用已提交结果。

diagnose：统计 records + 题目 set.json；cwd 为课程文档目录（global 为数据根），Agent 用 `read/grep/glob` 自行查阅，返回 markdown。

redrawFigure：题目与原 SVG/图片路径交给 Agent，要求只输出 `<svg>`；Host `sanitizeSvg()` 后写入 assets。

grade：**标准答案已准备**，只把题目、标准答案、学生答案交给 Agent；不读文档、不重新解题；`submit_grade` 返回判定与错因；Host 用已准备答案覆盖 `standardAnswer`。

chat：每个课程一个持久 Agent Session；cwd 为课程文档目录；prompt 只含当前题目、我的回答、选中文字与问题（首次/清空后附最近 6 条历史）；`onDelta` 转发流式正文。

### 5.7 `api.js`（host-api-dev）

```js
export function createApiRoutes({ store, jobs, tasks, llm, render, logger }) -> routes
// routes.register(ctx) 内部用 ctx.connection.fetch.register 注册第 4 节全部路由；
// routes.dispose() 由 ctx.effect 自动处理；bootstrap 需调用 store.ready() 并在 capabilities 中给出
// { images: await llm.supportsImages(), render: await render.available(), model: llm.selection() }
// 上传：base64 解码 → 校验 ext 白名单与大小（单文件 ≤ 25MB，单次 ≤ 100MB）→ 写课程目录；
//   doc：调用 extractDocument 抽取文本写 text.md（失败也保留 doc，status=failed/empty/unsupported）；
//   question：保存到新 set 的 source/ 目录，状态 draft；返回 setId。
// 所有写操作串行（store.update），出错转中文 JSON。
```

### 5.7b `agent-runtime.js`（host-api-dev，真实 DSH Agent）

```js
export function createAgentRuntime({ getAgents, getSessions, getTools, getAgentPresets, getDefaultModel, dataRoot, logger }) -> {
  available(): boolean,
  async runTurn({
    sessionKey, keepSession, cwd, promptText, allowTools, onDelta, signal, timeoutMs,
    submitTool?: {name, description, parameters, outputSchema},
    requireSubmit?: boolean, submitNudge?: string
  }) -> Promise<{ text: string, sessionId: string, result: object|null }>,
  async resetSession(sessionKey): Promise<void>,
  async dispose(): Promise<void>
}
```
- `submitTool` 注册到 Agent 作用域（`tools.register`），Agent 调用后参数直接成为 `result`；`requireSubmit` 时若第一轮未提交，会补一句极短提醒再等一轮。
- `text` 以 Session 日志中本轮最后一条有正文的 assistant 消息为准（`session.snapshotEvents(fromSeq)`），流式累计只作兜底。
- 超时/abort/运行失败：先 cancel，再把 `{text, result}` 挂到 `error.partial`，调用方可保留已提交结果。
- 提交工具与 `tools.guard` 配合：`restrict` 只收窄全局工具，preset 注册到 Agent 作用域的工具（bash/write 等）仍需 guard 拒绝；guard 白名单外返回中文拒绝原因。
- 解析/答案整理：直接给原件，允许 `read/read_image/bash/write/glob/grep`；判卷：只允许 `submit_grade`；对话：`sessionKey:'chat:<courseId>'`、`keepSession:true`、cwd 为课程文档目录。
- 运行时不可用直接抛中文错误；不再回退 `ctx.llm`。

### 5.8 `extract/index.js`（extract-dev）

```js
export const DOC_EXTS = ['.txt','.md','.markdown','.csv','.json','.html','.htm','.docx','.pptx','.pdf']
export function isSupportedDocExt(ext): boolean
export async function extractDocument({ absPath, ext, maxChars = 400000 }) 
  -> { text: string, warnings: string[], images: [{ name, data:Buffer, mediaType }] }
// 纯 Node 内置模块实现，无第三方依赖。PDF 尽力而为（文本层），失败返回 {text:'', warnings:[...]} 不抛错。
// docx/pptx 返回按阅读顺序的纯文本（段落 + 表格单元格 + 图片占位 [[图:fileName]]）。
// html 去标签；json/csv 转纯文本；md 保留结构。
```

## 6. 客户端架构（Lead 提供的基础设施）

### 6.1 构建

`tools/build-client.mjs`：读 `src/client/*.js`（排序拼接，放入 factory 函数体）+ `src/client/css/*.css`（排序拼接为 `__DSP_CSS__`）→ 写 `client.js` → `node --check client.js`。**只有 Lead 运行。**

### 6.2 必须先读的 Lead 文件

- `src/client/10-utils.js`：`h`、`DSP.t`、`DSP.Icon`、`DSP.Btn`、`DSP.IconBtn`、`DSP.Modal`、`DSP.Field`、`DSP.Tag`、`DSP.Empty`、`DSP.Spinner`、`DSP.markdown`、`DSP.api`、`DSP.fileToBase64`、`DSP.fmt*`、`DSP.useToast` 等（以实际实现为准，开发前先读）。
- `src/client/20-store.js`：`DSP.store` 与 `DSP.useStore(selector)`；所有服务端状态、当前视图、聊天草稿、任务进度的唯一真源。
- `src/client/90-app.js`：三栏壳；按 `DSP.store` 的 `ui.view` 渲染 `DSP.CourseHome / DSP.PracticeArea / DSP.CourseDashboard / DSP.GlobalDashboard`，右侧固定 `DSP.ChatPanel`，并挂载 `DSP.SelectionAction` / toast。
- `src/client/css/base.css`：布局/按钮/表单/弹窗/卡片等基础类，统一前缀 `dsp-`。

### 6.3 各碎片必须导出的符号（挂到 `DSP`）

| 文件 | 导出 |
|---|---|
| `30-rail.js` | `DSP.Rail`（左课程栏组件）；`DSP.CourseHome`（中间课程主页：文档管理 + 题目集列表 + 上传入口） |
| `40-practice.js` | `DSP.PracticeArea`（中间刷题区：解析进度 / 练习 / 结果） |
| `50-chat.js` | `DSP.ChatPanel`（右侧对话） |
| `60-dash.js` | `DSP.CourseDashboard`、`DSP.GlobalDashboard` |
| `70-selection.js` | `DSP.SelectionAction`（框选浮动按钮）、`DSP.handlePracticeSelection(e)`（PracticeArea 的 onMouseUp 调用）、`DSP.attachToChat(payload)` |
| `75-composer-attach.js` | 可选：聊天输入框上下文 chips 的渲染辅助（chat-ui-dev 自用即可） |

### 6.4 共享状态（`DSP.store`）约定

Lead 实现，字段以下面的语义为准（实现后以代码为准，不要改 store 私有实现）：

```js
DSP.store.get() -> {
  ready: boolean, loading: boolean, error: string|null,
  data: {                          // bootstrap 数据
    courses: Course[],             // 3.1 结构（records/sets/docs/analyses/chatThreads）
    global: { analysis: {markdown,generatedAt} | null },
    capabilities: {images, render, model}
  },
  ui: {
    view: 'course-home'|'practice'|'course-dash'|'global-dash',
    courseId: string|null,
    setId: string|null,
    questionIndex: number,
    mode: 'immediate'|'end',       // 当前套题模式
    chat: { threadId: string|null, draft: string, attachments: Attachment[], streaming: boolean, autoAsk: object|null },
    parse: { setId, jobId, status, message, progress }|null,
    analysisJob: {scope, jobId, status, message}|null,
    svgJob: {jobId, setId, questionId, figureIndex}|null,
    bump: number                    // 用于强制 chats 滚动等
  }
}
// DSP.store.actions:
//   init() / reload()                       // 拉 bootstrap
//   ui(patch)                               // 浅合并 ui
//   openCourse(courseId) / openPractice(courseId, setId) / openCourseDash(courseId) / openGlobalDash()
//   createCourse({name, description})       // Promise
//   updateCourse({courseId, patch}) / deleteSet({courseId,setId})
//   uploadDocs(courseId, files)             // File[]/FileList，内部逐个上传，返回 {docs, skipped}
//   uploadQuestions(courseId, files)        // 返回 {setId, skipped}；创建后自动开始解析
//   startParse({courseId, setId})           // 起 job + 轮询进度
//   pollJob(jobId)                          // 工具：Promise<job>
//   saveRecords(records)                    // POST answers
//   completeSet()                           // POST set/complete
//   setMode(mode)
//   diagnose(scope)                         // 起分析 job + 轮询，完成 reload
//   redrawFigure({questionId, figureIndex})
//   chatSend(text, opts)                    // SSE；opts:{questionId?, selectedText?, docNames?}
//   chatClear() / chatNew()
//   askQuestion(question)                   // 一键提问：切 chat 上下文并直接发送
//   attachToChat({text,label})              // 框选附加
//   toast(text, kind)
//   loadSet(courseId, setId)                // Promise<set.json>，组件缓存
// }
```

### 6.5 组件约定

- 组件用 `h(type, props, ...children)` 书写；不要 JSX。
- 所有组件从 `DSP.store` 读取全局状态（`DSP.useStore(...)`），局部交互状态用 `React.useState`。
- 避免在每个组件里重复 fetch bootstrap；需要 set.json 时用 `DSP.store.actions.loadSet` 并按 setId 缓存（Lead 的 store 提供 `DSP.store.getSet(setId)`）。
- 文字通过 `DSP.t('中文')` 输出（Lead 提供 zh/en 回落映射）。
- 图标用 `DSP.Icon({name, size})`，可用 name 见 10-utils（Lead 提供：logo, plus, upload, folder, doc, image, trash, chat, send, sparkles, check, x, chevronDown, chevronLeft, chevronRight, book, chart, refresh, arrowLeft, clock, search, edit, more, alert, bulb, target, list, play）。
- 样式：自己的 CSS 文件 + 类名前缀 `dsp-`；颜色只用 `--dsw-alias-*` 主题 token；圆角/字体可用 host 常见 token（`--dsw-radius-md` 等）并给 fallback。禁止引入 primitives 或任何 Harness Client 包。
- 不要写 `document.body`，不要读写其他插件的 DOM；框选浮层用固定定位并挂在本组件树内。
- 键盘可用性：按钮都是 `<button type="button">`，弹窗支持 Esc 关闭。

## 7. UI 规格（三栏）

整体：`height:100%; box-sizing:border-box; padding-top: var(--dsh-frame-top-clearance,0px)`（Lead base.css 已处理）；三个滚动列主体独立滚动；底色 `--dsw-alias-bg-base`；卡片 `--dsw-alias-bg-layer-1`；边框 `--dsw-alias-border-l1/l2`。

- **左栏 Rail（236px）**：顶部品牌行「📘 刷题模式」+ 新建课程按钮；课程列表（名称、题目集数、正确率）；选中高亮；底部「所有课程看板」按钮 + 数据根提示。
- **中间主区**：
  - CourseHome：课程标题/简介 + 两个区块：「题目集」（上传题目文件按钮 + 套题卡片列表：标题、状态、题数、正确率、开始/继续/删除）与「课程文档」（上传文件/上传文件夹按钮 + 文档列表：名称、大小、抽取状态、删除）。
  - PracticeArea：无套题时引导上传；解析中进度卡；练习界面（顶部：返回课程、套题标题、进度 N/M、模式徽标；中部：题目卡；底部：上一题/下一题/提交/交卷）；解析区（答案、解析、一键提问、图片重绘按钮）；结束页（本套统计 + 继续上传 + 生成复习建议 + 查看课程看板）。
  - Dashboards：统计卡（刷题数/正确率/已刷套数/复习天数）、题型正确率条形图（纯 CSS/SVG）、趋势（最近 7 天 SVG 折线）、易错题列表（可跳转练习）、AI 学情分析与复习方案（markdown + 生成/刷新按钮）。
- **右栏 Chat（380px）**：头部「答疑助手」+ 新对话；上下文栏（当前题目 / 选中文字 ×）；消息列表（用户/助手气泡，markdown 渲染，流式光标）；输入区（textarea + 发送；Enter 发送，Shift+Enter 换行）；空态提示。一键提问时自动滚动到底部。

## 8. 测试与验收（各 owner 自测）

- `"$NODE" --check` 所有自己写的 .js/.mjs。
- host-api-dev：`test/store.test.mjs`（临时目录：create/update/原子写、path 越界拒绝）、`test/api.test.mjs`（用假 ctx 或直接调用内部 handler 的函数，覆盖 course/upload/answers/job 逻辑）。
- extract-dev：`test/extract.test.mjs`，用 python 生成 docx/pptx fixture（写进 `test/fixtures/`，测试时生成）、md/txt；如能生成 PDF 则测 pdf 文本。
- host-llm-dev：`test/prompts.test.mjs`（normalizeParsedSet 各种脏 JSON、跨题 material、figure 落盘路径）、`test/render.test.mjs`（CLI available+render 真实小 PDF，若运行环境较慢可 skip 但要用 `node --test` 报告）。
- UI 三个 owner：`node --check src/client/<file>.js`；自检 store 字段名与 Lead 代码一致；不要运行 build。
- 完成后给 Lead 发消息：`完成 <文件列表>；测试命令与结果；遗留问题`。

## 9. 协作规则

- 所有文件读写限定在 `practice-mode/` 下；不要写 profile、不要安装。
- 接口冲突：以本文件为准；必须改契约时先发消息给 Lead，得到确认再改，并更新本文件对应小节。
- 大文件（>1200 行）拆成多个碎片放到自己 ownership 内的文件（30-rail.js 可再拆 31-*.js；40-practice.js 拆 41-*.js 等，但都要在文件名排序后位于 90-app.js 之前，且挂到 DSP）。
- 每次完成一个可交付里程碑就发消息，不要等全部做完才说。


## 9. Agent 提示与提交工具

不再导出/读取 `<dataRoot>/prompts/`。提示词在 `lib/host/prompts.js` 内组装，必须包含**明确的输出格式**（字段名），结构化结果再由 Agent 作用域内的提交工具回传：

- `submit_questions`：解析题目（title/groups/questions）；
- `submit_answer_key`：答案文件（answers: number/answer/answerDisplay/analysis）；
- `submit_reference_answers`：AI 参考答案（answers + refs）；
- `submit_grade`：判题（verdict/score/standardAnswer/mistakeAnalysis/explanation/suggestions/refs）。

`normalizeParsedSet / normalizeAnswerKey / normalizeGeneratedAnswers / normalizeGradeResult` 同时接受提交工具对象与文本形式的 JSON，便于工具未调用时兜底。
