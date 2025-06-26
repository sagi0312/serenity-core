// utils/history.js
import fs from 'fs/promises'
import path from 'path'
import { homedir } from 'os'

const HISTORY_DIR = path.join(homedir(), 'Desktop', 'chat-history')

// Ensure directory exists
const init = async () => {
  try {
    await fs.mkdir(HISTORY_DIR, { recursive: true })
  } catch (error) {
    console.error(`Failed to create storage directory: ${HISTORY_DIR}`)
    console.error(error)
    process.exit(1) // Exit if we can't create storage
  }
}
init()

export const saveMessage = async (sessionId, question, answer) => {
  const timestamp = new Date().toISOString()
  const entry = { timestamp, question, answer }

  const filePath = path.join(HISTORY_DIR, `${sessionId}.json`)

  try {
    // Read existing history
    let history = []
    try {
      const data = await fs.readFile(filePath)
      history = JSON.parse(data)
    } catch {} // File doesn't exist yet

    // Add new entry and save
    history.push(entry)
    await fs.writeFile(filePath, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error(`Failed to save history for session ${sessionId}:`, error)
    throw error
  }
}

export const getHistory = async sessionId => {
  const filePath = path.join(HISTORY_DIR, `${sessionId}.json`)
  try {
    const data = await fs.readFile(filePath)
    return JSON.parse(data)
  } catch {
    return [] // Return empty array if no history exists
  }
}
