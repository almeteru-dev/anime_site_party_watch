import fs from "node:fs/promises"
import path from "node:path"
import mammoth from "mammoth"

const DOCS_DIR = path.resolve(process.cwd(), "..", "docs")

export async function loadDocxAsHtml(filename: string) {
  const docxPath = path.resolve(DOCS_DIR, filename)
  try {
    const buffer = await fs.readFile(docxPath)
    const result = await mammoth.convertToHtml({ buffer })
    return result.value
  } catch (err) {
    console.error("loadDocxAsHtml failed", { filename, docxPath, err })
    throw err
  }
}
