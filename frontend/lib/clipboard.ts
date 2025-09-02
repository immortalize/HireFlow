/**
 * Utility function to copy text to clipboard with fallback support
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Try modern clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for non-secure contexts or older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        return successful
      } catch (err) {
        console.error('Fallback copy failed:', err)
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.error('Copy to clipboard error:', error)
    return false
  }
}

/**
 * Utility function to copy a URL to clipboard with user-friendly error handling
 * @param url - The URL to copy
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const copyUrlToClipboard = async (url: string): Promise<boolean> => {
  return await copyToClipboard(url)
}
