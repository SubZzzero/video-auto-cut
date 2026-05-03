// Convert unknown API failures into readable UI text.
export function getErrorMessage(error) {
  if (error?.response?.data?.detail) {
    return String(error.response.data.detail)
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}
