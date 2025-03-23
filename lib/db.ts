import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
export { sql }

// Helper function to convert database rows to camelCase
export function toCamelCase<T>(rows: any[]): T[] {
  return rows.map((row) => {
    const newRow: any = {}
    for (const key in row) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      newRow[camelKey] = row[key]
    }
    return newRow as T
  })
}

