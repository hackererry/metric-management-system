/**
 * IP权限认证服务
 * - 获取客户端IP的权限信息
 * - 缓存权限结果
 * - 提供权限校验方法
 */
import axios from 'axios';

export interface IPPermission {
  ip: string;
  is_whitelisted: boolean;
  permissions: string[]; // ["all"] 或 ["product_a", "product_b"] 等
}

// 权限缓存
let cachedPermission: IPPermission | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

// 真实的浏览器IP（从后端接口获取）
let browserRealIP: string = '';

/**
 * 获取浏览器真实IP（通过后端接口，从请求头获取）
 */
async function getBrowserRealIP(): Promise<string> {
  if (browserRealIP) {
    return browserRealIP;
  }

  try {
    // 调用后端接口获取客户端IP（nginx设置的X-Real-IP头）
    const response = await axios.get<{ ip: string }>('/api/auth/client-ip');
    browserRealIP = response.data.ip || '';
    return browserRealIP;
  } catch (error) {
    console.error('获取浏览器IP失败:', error);
    return 'unknown';
  }
}

/**
 * 获取当前IP的权限信息
 */
export async function getIPPermission(): Promise<IPPermission> {
  const now = Date.now();

  // 检查缓存是否有效
  if (cachedPermission && (now - cacheTime) < CACHE_DURATION) {
    return cachedPermission;
  }

  try {
    // 获取浏览器真实IP
    const realIP = await getBrowserRealIP();

    // 调用后端权限接口，传递真实IP（通过POST请求体）
    const response = await axios.post<{ ip: string; is_whitelisted: boolean; permissions: string[] }>(
      '/api/auth/ip-permission',
      { client_ip: realIP }
    );

    cachedPermission = {
      ip: response.data.ip,
      is_whitelisted: response.data.is_whitelisted,
      permissions: response.data.permissions || []
    };
    cacheTime = now;
    return cachedPermission;
  } catch (error) {
    // 请求失败时，返回非白名单权限（保守策略）
    console.error('获取IP权限失败:', error);
    return {
      ip: 'unknown',
      is_whitelisted: false,
      permissions: []
    };
  }
}

/**
 * 检查是否有写权限
 * @param category 可选的指标分类，如 product_a, overview 等
 */
export async function hasWritePermission(category?: string): Promise<boolean> {
  const permission = await getIPPermission();

  // 非白名单IP没有写权限
  if (!permission.is_whitelisted) {
    return false;
  }

  // 白名单IP有写权限
  if (permission.permissions.includes('all')) {
    return true;
  }

  // 按分类细粒度控制
  if (category && permission.permissions.includes(category)) {
    return true;
  }

  // 如果没有指定分类，则需要是白名单IP即可
  if (!category) {
    return permission.is_whitelisted;
  }

  return false;
}

/**
 * 清除权限缓存
 */
export function clearPermissionCache(): void {
  cachedPermission = null;
  cacheTime = 0;
}

/**
 * 检查是否有指定分类的写权限（同步版本，使用缓存）
 * 注意：需要先调用过 getIPPermission 或 hasWritePermission
 */
export function hasWritePermissionSync(category?: string): boolean {
  if (!cachedPermission) {
    return false;
  }

  if (!cachedPermission.is_whitelisted) {
    return false;
  }

  if (cachedPermission.permissions.includes('all')) {
    return true;
  }

  if (category && cachedPermission.permissions.includes(category)) {
    return true;
  }

  if (!category) {
    return cachedPermission.is_whitelisted;
  }

  return false;
}
