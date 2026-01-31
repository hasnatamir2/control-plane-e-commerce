import { ApiError, Customer } from '@shared/types/external-api.types'

export interface ICustomerApiClient {
  getCustomer(customerId: string): Promise<Customer>
}

export class CustomerApiClient implements ICustomerApiClient {
  private readonly baseUrl: string

  constructor(
    baseUrl: string = process.env.CUSTOMER_API_URL || 'http://localhost:3001/api/customers'
  ) {
    this.baseUrl = baseUrl
  }

  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const response = await fetch(`${this.baseUrl}/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = (await response.json()) as ApiError
        throw new Error(error.Message || `Failed to fetch customer: ${response.statusText}`)
      }

      const customer = (await response.json()) as Customer
      return customer
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Customer API Error: ${error.message}`)
      }
      throw new Error('Customer API Error: Unknown error occurred')
    }
  }
}
