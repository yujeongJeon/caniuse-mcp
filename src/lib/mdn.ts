import {DATA_SOURCES, type SupportStatus} from './consts.js'

export const MDN_MAIN_BROWSERS = ['chrome', 'edge', 'safari', 'firefox', 'safari_ios', 'chrome_android']
interface MDNSupport {
    version_added: string | boolean | null
    version_removed?: string | boolean
    partial_implementation?: boolean
    prefix?: string
    alternative_name?: string
    flags?: Array<{
        type: 'preference' | 'compile_flag' | 'runtime_flag'
        name: string
        value_to_set?: string
    }>
    notes?: string | string[]
}

export interface SimplifiedMDNSupport {
    status: SupportStatus
    sinceVersion?: string
    untilVersion?: string
    requiresPrefix?: boolean
    requiresFlag?: boolean
    notes?: string[]
}

export function parseMDNSupport(browserSupport: MDNSupport | MDNSupport[] | string): SimplifiedMDNSupport[] {
    // "mirror" 같은 특수 케이스
    if (typeof browserSupport === 'string') {
        return [
            {
                status: 'unknown',
                notes: [`Mirrors another browser: ${browserSupport}`],
            },
        ]
    }

    // 배열인 경우 (여러 지원 상태)
    const supports = Array.isArray(browserSupport) ? browserSupport : [browserSupport]

    return supports.map((support) => {
        let status: SupportStatus

        if (support.version_added === false) {
            status = 'not_supported'
        } else if (support.version_added === null) {
            status = 'unknown'
        } else if (support.partial_implementation) {
            status = 'partial'
        } else if (support.prefix) {
            status = 'prefixed'
        } else {
            status = 'supported'
        }

        const notes: string[] = []
        if (support.notes) {
            notes.push(...(Array.isArray(support.notes) ? support.notes : [support.notes]))
        }
        if (support.alternative_name) {
            notes.push(`Available as: ${support.alternative_name}`)
        }
        if (support.prefix) {
            notes.push(`Requires prefix: ${support.prefix}`)
        }

        return {
            status,
            sinceVersion: typeof support.version_added === 'string' ? support.version_added : undefined,
            untilVersion: typeof support.version_removed === 'string' ? support.version_removed : undefined,
            requiresPrefix: !!support.prefix,
            requiresFlag: !!support.flags && support.flags.length > 0,
            notes: notes.length > 0 ? notes : undefined,
        }
    })
}

// 중첩된 경로로 객체 접근 헬퍼
export function getNestedProperty(obj: any, path: string): any {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]

        if (!current || typeof current !== 'object') {
            return undefined
        }

        // 1. 정확한 키 매칭 시도
        if (key in current) {
            current = current[key]
            continue
        }

        // 2. 대소문자 무시 매칭
        const lowerKey = key.toLowerCase()
        const foundKey = Object.keys(current).find((k) => k.toLowerCase() === lowerKey)

        if (foundKey) {
            current = current[foundKey]
            continue
        }

        // 3. 특수 케이스: --iterator → @@iterator 또는 Symbol.iterator
        if (key === '--iterator') {
            const iteratorKey = Object.keys(current).find((k) => k === '@@iterator' || k.includes('iterator'))
            if (iteratorKey) {
                current = current[iteratorKey]
                continue
            }
        }

        // e.g. "constructor.without.parameters" → "constructor_without_parameters"
        if (i < keys.length - 1) {
            // 나머지 키들을 합쳐서 시도
            const remainingPath = keys.slice(i).join('.')
            const combinedKey = keys.slice(i).join('_')

            const foundCombinedKey = Object.keys(current).find(
                (k) => k.toLowerCase() === combinedKey.toLowerCase() || k.toLowerCase() === remainingPath.toLowerCase(),
            )

            if (foundCombinedKey) {
                current = current[foundCombinedKey]
                break
            }
        }

        return undefined
    }

    return current
}

export function mdnIdToBcdPath(mdnId: string): string {
    let path = mdnId.replace(/^mdn-/, '')

    // 더블 언더스코어는 싱글 언더스코어로, 싱글 언더스코어는 점(.)으로 치환
    path = path.replace(/__/g, '.@@')
    path = path.replace(/_/g, '.')
    path = path.replace(/@@/g, '_')

    return path
}

export async function fetchMDNData() {
    const mdnData = await fetch(DATA_SOURCES.mdn, {
        cache: 'force-cache',
        headers: {
            'Cache-Control': 'max-age=2592000',
        },
    }).then((r) => r.json())
    return mdnData
}
