import type { SupabaseClient } from '@supabase/supabase-js'

type StorageTarget = { bucket: string; path: string }

/** Supabaseのpublic URLをStorageのバケット名とオブジェクトパスへ戻す。 */
export function parseStoragePublicUrl(url: string | null): StorageTarget | null {
	if (!url) return null
	try {
		const parsed = new URL(url)
		const marker = '/storage/v1/object/public/'
		const markerIndex = parsed.pathname.indexOf(marker)
		if (markerIndex < 0) return null
		const remainder = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
		const separator = remainder.indexOf('/')
		if (separator < 1) return null
		return {
			bucket: remainder.slice(0, separator),
			path: remainder.slice(separator + 1),
		}
	} catch {
		return null
	}
}

export async function removeStorageTargets(
	admin: SupabaseClient,
	targets: StorageTarget[],
) {
	const grouped = new Map<string, Set<string>>()
	for (const target of targets) {
		const paths = grouped.get(target.bucket) ?? new Set<string>()
		paths.add(target.path)
		grouped.set(target.bucket, paths)
	}

	for (const [bucket, pathSet] of grouped) {
		const paths = [...pathSet]
		for (let index = 0; index < paths.length; index += 100) {
			const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 100))
			if (error) throw error
		}
	}
}

/** UUIDフォルダ内を再帰的に列挙してStorage API経由で削除する。 */
export async function removeStorageTree(
	admin: SupabaseClient,
	bucket: string,
	prefix: string,
) {
	const files: string[] = []

	async function walk(folder: string): Promise<void> {
		let offset = 0
		while (true) {
			const { data, error } = await admin.storage.from(bucket).list(folder, {
				limit: 100,
				offset,
			})
			if (error) {
				if (/not found/i.test(error.message)) return
				throw error
			}
			if (!data?.length) return

			for (const item of data) {
				const path = folder ? `${folder}/${item.name}` : item.name
				if (item.id) files.push(path)
				else await walk(path)
			}

			if (data.length < 100) return
			offset += data.length
		}
	}

	await walk(prefix)
	if (files.length === 0) return
	await removeStorageTargets(admin, files.map((path) => ({ bucket, path })))
}
