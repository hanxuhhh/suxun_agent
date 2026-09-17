import axios from 'axios'
import { message } from 'antd'
import { API_BASE } from './apiBase'

const request = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code !== 0) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误，请稍后重试'
    message.error(msg)
    return Promise.reject(error)
  }
)

export default request
