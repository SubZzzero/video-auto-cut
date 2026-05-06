import axios from 'axios'

import { API_BASE_URL } from '../config/constants'

const client = axios.create({
  baseURL: API_BASE_URL,
})

// Submit one file and processing settings to the backend.
export async function createProcessJob(file, settings) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('duration', String(settings.duration))
  formData.append('crop', settings.crop)
  if (Number.isInteger(settings.cropX)) {
    formData.append('cropX', String(settings.cropX))
  }
  if (Number.isInteger(settings.cropY)) {
    formData.append('cropY', String(settings.cropY))
  }
  formData.append('startTime', String(settings.startTime))
  formData.append('endTime', String(settings.endTime))

  const response = await client.post('/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// Fetch the current status of one processing job.
export async function getJobStatus(jobId) {
  const response = await client.get(`/jobs/${jobId}`)
  return response.data
}
