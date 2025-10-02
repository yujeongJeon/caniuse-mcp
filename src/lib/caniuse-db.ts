import type {SupportStatus} from './consts.js'

interface BrowserAgent {
    browser: string
    current_version: string
    version_list: Array<{
        version: string
        global_usage: number
        release_date: number
    }>
}

export interface FeatureData {
    title: string
    description: string
    stats: {
        [browser: string]: {
            [version: string]: string
        }
    }
    notes_by_num?: Record<string, string>
}

function mapStatusCode(code: string): SupportStatus {
    switch (code) {
        case 'y':
            return 'supported'
        case 'n':
            return 'not_supported'
        case 'a':
            return 'partial'
        case 'x':
            return 'prefixed'
        case 'p':
            return 'polyfill'
        case 'd':
            return 'disabled'
        case 'u':
            return 'unknown'
        default:
            return 'unknown'
    }
}

export interface GroupedVersionSupport {
    versions: string
    status: SupportStatus
    requiresPrefix?: boolean
    requiresFlag?: boolean
    hasPolyfill?: boolean
    notes?: string[]
    isCurrent?: boolean
}

export const CANIUSE_MAIN_BROWSERS = ['chrome', 'firefox', 'safari', 'edge', 'ios_saf', 'and_chr']

function parseStatusString(statusString: string, notesByNum?: Record<string, string>) {
    const parts = statusString.split(' ')
    const mainStatus = mapStatusCode(parts[0])

    const flags = {
        requiresPrefix: parts.includes('x'),
        requiresFlag: parts.includes('d'),
        hasPolyfill: parts.includes('p'),
    }

    const noteNumbers = parts.filter((p) => p.startsWith('#')).map((p) => p.substring(1))

    const notes = noteNumbers.map((num) => notesByNum?.[num]).filter(Boolean) as string[]

    return {
        status: mainStatus,
        flags,
        notes,
    }
}

function formatVersionRange({versions, isLastGroup}: {versions: string[]; isLastGroup: boolean}): string {
    if (versions.length === 1) {
        return isLastGroup ? `${versions[0]}+` : versions[0]
    }

    const first = versions[0]
    const last = versions[versions.length - 1]

    if (isLastGroup) {
        return `${first}+`
    }

    return `${first}-${last}`
}

export function groupBrowserVersions(
    browserStats: {[version: string]: string},
    browserAgent: BrowserAgent,
    notesByNum?: Record<string, string>,
): GroupedVersionSupport[] {
    const group: GroupedVersionSupport[] = []
    const versionList = browserAgent.version_list
    const currentVersion = browserAgent.current_version

    let prevStatus = null
    let currentGroup: {
        versions: string[]
        statusString: string
        isCurrent: boolean
    } | null = null

    for (const {version} of versionList) {
        const statusString = browserStats[version]
        if (!statusString) continue

        const isCurrent = version === currentVersion

        // 상태가 바뀌거나 현재 버전이면 새 그룹 시작
        if (statusString !== prevStatus || isCurrent) {
            // 이전 그룹 저장
            if (currentGroup && currentGroup.versions.length > 0) {
                const parsed = parseStatusString(currentGroup.statusString, notesByNum)

                group.push({
                    versions: formatVersionRange({
                        versions: currentGroup.versions,
                        isLastGroup: false,
                    }),
                    status: parsed.status,
                    requiresPrefix: parsed.flags.requiresPrefix || undefined,
                    requiresFlag: parsed.flags.requiresFlag || undefined,
                    hasPolyfill: parsed.flags.hasPolyfill || undefined,
                    notes: parsed.notes.length > 0 ? parsed.notes : undefined,
                    isCurrent: currentGroup.isCurrent || undefined,
                })
            }

            // 새 그룹 시작
            currentGroup = {
                versions: [version],
                statusString,
                isCurrent,
            }
        } else {
            currentGroup.versions.push(version)
        }

        prevStatus = isCurrent ? null : statusString
    }

    // 마지막 그룹 저장
    if (currentGroup && currentGroup.versions.length > 0) {
        const parsed = parseStatusString(currentGroup.statusString, notesByNum)

        group.push({
            versions: formatVersionRange({
                versions: currentGroup.versions,
                isLastGroup: true,
            }),
            status: parsed.status,
            requiresPrefix: parsed.flags.requiresPrefix || undefined,
            requiresFlag: parsed.flags.requiresFlag || undefined,
            hasPolyfill: parsed.flags.hasPolyfill || undefined,
            notes: parsed.notes.length > 0 ? parsed.notes : undefined,
            isCurrent: currentGroup.isCurrent || undefined,
        })
    }

    return group
}
