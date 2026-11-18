/**
 * store.js 单元测试：数据根初始化、原子写、串行 update、回滚、路径越界防护与文件工具。
 *
 * 运行：node --test test/store.test.mjs
 */

import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createStore } from '../lib/host/store.js';

/** 建一个临时数据根，测试结束自动清理。 */
async function makeStore(t) {
	const root = await mkdtemp(join(tmpdir(), 'practice-store-'));
	t.after(async () => {
		await rm(root, { recursive: true, force: true });
	});
	const store = await createStore({ rootDir: root });
	return { root, store };
}

/** 递归收集目录下的文件名（用于断言没有残留 .tmp-*）。 */
async function listFiles(dir) {
	const result = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) result.push(...(await listFiles(full)));
		else result.push(full);
	}
	return result;
}

test('ready 初始化数据根与默认 store.json', async (t) => {
	const { root, store } = await makeStore(t);
	const state = await store.ready();
	assert.equal(state.version, 1);
	assert.deepEqual(state.courses, []);
	assert.deepEqual(state.global, { analysis: null });
	assert.ok(Number.isFinite(state.updatedAt));
	assert.ok(await store.exists('store.json'));
	assert.ok(await store.exists('tmp'));
	assert.ok(await store.exists('courses'));
	const parsed = JSON.parse(await readFile(join(root, 'store.json'), 'utf8'));
	assert.equal(parsed.version, 1);
	assert.deepEqual(parsed.courses, []);
});

test('get() 在 ready() 之前抛错，ready 后可拿到同步快照', async (t) => {
	const root = await mkdtemp(join(tmpdir(), 'practice-store-'));
	t.after(async () => rm(root, { recursive: true, force: true }));
	const store = createStore({ rootDir: root });
	assert.throws(() => store.get(), /尚未初始化/);
	const first = store.ready();
	const second = store.ready();
	assert.equal(await first, await second, 'ready() 必须幂等');
	assert.equal(store.get(), await first);
});

test('newId 生成带前缀的短 id 且不重复', async (t) => {
	const { store } = await makeStore(t);
	await store.ready();
	const ids = new Set();
	for (let index = 0; index < 200; index += 1) {
		const id = store.newId('c');
		assert.match(id, /^c_[a-z0-9]{8}$/);
		ids.add(id);
	}
	assert.ok(ids.size > 190, 'id 碰撞率应极低');
	assert.match(store.newId('s'), /^s_[a-z0-9]{8}$/);
});

test('update 原子落盘且可被新 store 实例读回', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	await store.update((state) => {
		state.courses.push({ id: 'c_test0001', name: '高等数学', description: '' });
	});
	const reloaded = await createStore({ rootDir: root }).ready();
	assert.equal(reloaded.courses.length, 1);
	assert.equal(reloaded.courses[0].name, '高等数学');

	const parsed = JSON.parse(await readFile(join(root, 'store.json'), 'utf8'));
	assert.equal(parsed.courses[0].id, 'c_test0001');
	// 原子写：同目录不留下临时文件。
	const files = await listFiles(root);
	assert.deepEqual(files.filter((file) => file.includes('.tmp-')), []);
});

test('update mutator 抛错时不改内存也不落盘', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	await store.update((state) => {
		state.courses.push({ id: 'c_keep0001', name: '保留' });
	});
	const before = JSON.stringify(store.get());

	await assert.rejects(
		store.update((state) => {
			state.courses[0].name = '被污染';
			state.courses.push({ id: 'c_bad', name: '不该出现' });
			throw new Error('故意失败');
		}),
		/故意失败/
	);
	assert.equal(JSON.stringify(store.get()), before, '内存状态必须回滚');
	const onDisk = JSON.parse(await readFile(join(root, 'store.json'), 'utf8'));
	assert.equal(onDisk.courses.length, 1);
	assert.equal(onDisk.courses[0].name, '保留');
});

test('update 支持 async mutator 且抛错回滚', async (t) => {
	const { store } = await makeStore(t);
	await store.ready();
	await store.update(async (state) => {
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
		state.global.analysis = { markdown: '# 分析', generatedAt: 1 };
	});
	assert.equal(store.get().global.analysis.markdown, '# 分析');
	await assert.rejects(
		store.update(async (state) => {
			await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
			state.global.analysis = null;
			throw new Error('异步失败');
		}),
		/异步失败/
	);
	assert.equal(store.get().global.analysis.markdown, '# 分析');
});

test('并发 update 串行执行，不丢写入', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	await store.update((state) => {
		state.global.counter = 0;
	});
	const tasks = [];
	for (let index = 0; index < 25; index += 1) {
		tasks.push(
			store.update(async (state) => {
				const current = state.global.counter ?? 0;
				await new Promise((resolvePromise) => setTimeout(resolvePromise, 1));
				state.global.counter = current + 1;
			})
		);
	}
	await Promise.all(tasks);
	assert.equal(store.get().global.counter, 25);
	const onDisk = JSON.parse(await readFile(join(root, 'store.json'), 'utf8'));
	assert.equal(onDisk.global.counter, 25);
});

test('abs 拒绝绝对路径与越界路径，正常路径在根内', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	assert.throws(() => store.abs('../escape.txt'), /越界/);
	assert.throws(() => store.abs('courses/../../escape.txt'), /越界/);
	assert.throws(() => store.abs('/etc/passwd'), /绝对路径/);
	assert.throws(() => store.abs(''), /不能为空/);
	assert.throws(() => store.abs('courses/\u0000x'), /非法字符/);
	assert.equal(store.abs('courses/c_1/sets/s_1/set.json'), join(root, 'courses/c_1/sets/s_1/set.json'));
	assert.equal(store.abs('courses/a/../b'), join(root, 'courses/b'));
});

test('文件工具：dir/writeFile/readFile/readText/exists/remove', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	const dirPath = await store.dir('courses/c_1/sets/s_1/pages');
	assert.equal(dirPath, join(root, 'courses/c_1/sets/s_1/pages'));
	assert.deepEqual(await readdir(dirPath), []);

	await store.writeFile('courses/c_1/sets/s_1/pages/page-0001.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	const buffer = await store.readFile('courses/c_1/sets/s_1/pages/page-0001.png');
	assert.ok(Buffer.isBuffer(buffer));
	assert.deepEqual([...buffer], [0x89, 0x50, 0x4e, 0x47]);

	await store.writeFile('courses/c_1/notes.md', '# 标题\n正文');
	assert.equal(await store.readText('courses/c_1/notes.md'), '# 标题\n正文');
	assert.equal(await store.exists('courses/c_1/notes.md'), true);
	assert.equal(await store.exists('courses/c_1/missing.md'), false);
	await assert.rejects(store.writeFile('../bad.txt', 'x'), /越界/);
	await assert.rejects(store.readText('../store.json'), /越界/);

	await store.remove('courses/c_1/notes.md');
	assert.equal(await store.exists('courses/c_1/notes.md'), false);
	await store.remove('courses/c_1'); // 目录递归删除
	assert.equal(await store.exists('courses/c_1'), false);
	await store.remove('courses/c_1'); // 幂等
});

test('损坏的 store.json 会备份并重建默认数据', async (t) => {
	const root = await mkdtemp(join(tmpdir(), 'practice-store-'));
	t.after(async () => rm(root, { recursive: true, force: true }));
	await mkdir(root, { recursive: true });
	await writeFile(join(root, 'store.json'), '{ 这不是合法 JSON', 'utf8');
	const store = await createStore({ rootDir: root });
	const state = await store.ready();
	assert.deepEqual(state.courses, []);
	const files = await readdir(root);
	const backup = files.find((file) => file.startsWith('store.json.corrupt-'));
	assert.ok(backup !== undefined, '损坏文件应备份');
	const backupStat = await stat(join(root, backup));
	assert.ok(backupStat.isFile());
	const repaired = JSON.parse(await readFile(join(root, 'store.json'), 'utf8'));
	assert.equal(repaired.version, 1);
});

test('store.rootDir 暴露只读数据根', async (t) => {
	const { root, store } = await makeStore(t);
	await store.ready();
	assert.equal(store.rootDir, root);
});
