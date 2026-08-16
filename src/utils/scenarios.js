// 自定义场景预设纯函数：校验、序列化、与内置合并去重（无 DOM、无 localStorage）。

export const CUSTOM_PREFIX = 'custom:';
export const SCENARIO_SIZE_MIN = 1;
export const SCENARIO_SIZE_MAX = 20000;

/** 宽/高是否合法（1-20000 的整数） */
export function isValidScenarioSize(n) {
  return Number.isInteger(n) && n >= SCENARIO_SIZE_MIN && n <= SCENARIO_SIZE_MAX;
}

/**
 * 归一化一条自定义场景；非法返回 null。
 * @param {{name?: string, width?: number|string, height?: number|string}} input
 * @returns {{name: string, width: number, height: number}|null}
 */
export function normalizeScenario(input) {
  if (!input || typeof input !== 'object') return null;
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const width = Number(input.width);
  const height = Number(input.height);
  if (!name) return null;
  if (!isValidScenarioSize(width) || !isValidScenarioSize(height)) return null;
  return { name, width, height };
}

/** 场景尺寸键（用于去重）：width x height */
export function scenarioSizeKey(width, height) {
  return `${width}x${height}`;
}

/** 序列化：过滤非法项并按尺寸去重（保留首个） */
export function serializeCustomScenarios(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const s = normalizeScenario(item);
    if (!s) continue;
    const key = scenarioSizeKey(s.width, s.height);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/** 解析 localStorage 字符串为自定义场景列表；任何异常回退空数组 */
export function parseCustomScenarios(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return serializeCustomScenarios(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** 生成自定义场景的 option value（自描述，Worker 内无需 localStorage 也能解析） */
export function customScenarioValue(width, height) {
  return `${CUSTOM_PREFIX}${width}x${height}`;
}

/** 解析自定义场景 value；非自定义返回 null */
export function parseCustomScenarioId(id) {
  if (typeof id !== 'string' || !id.startsWith(CUSTOM_PREFIX)) return null;
  const rest = id.slice(CUSTOM_PREFIX.length);
  const [w, h] = rest.split('x').map(Number);
  if (!isValidScenarioSize(w) || !isValidScenarioSize(h)) return null;
  return { width: w, height: h };
}

/** 过滤掉与内置场景尺寸重复的自定义项 */
export function filterOutBuiltin(custom, builtin) {
  const list = serializeCustomScenarios(custom);
  const builtinKeys = new Set(
    (Array.isArray(builtin) ? builtin : []).map((s) => scenarioSizeKey(s.width, s.height)),
  );
  return list.filter((s) => !builtinKeys.has(scenarioSizeKey(s.width, s.height)));
}
